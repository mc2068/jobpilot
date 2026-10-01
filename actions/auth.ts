"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

import {
  CODE_VERIFIER_COOKIE,
  OAUTH_PROVIDER_COOKIE,
} from "@/lib/insforge-server";
import { logPostHogError, logPostHogInfo } from "@/lib/posthog-logger";
import { POSTHOG_RESET_COOKIE } from "@/lib/posthog-shared";
import { CALLBACK_PATH, HOME_PATH, LOGIN_ERROR_PATH } from "@/lib/routes";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/types";

// Without a base URL, new URL() throws and every sign-in fails with only a
// generic error, so fall back to the local dev server.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const OAUTH_COOKIE_MAX_AGE = 600;
const POSTHOG_RESET_MAX_AGE = 60 * 60 * 24;

// Both actions end in a redirect, so they return nothing — redirect() must be
// called outside try/catch because it works by throwing. PostHog logs go
// through after() so a slow ingestion endpoint never delays the redirect.
export async function signInWithProvider(
  provider: OAuthProvider,
): Promise<void> {
  if (!OAUTH_PROVIDERS.includes(provider)) {
    redirect(LOGIN_ERROR_PATH);
  }

  let authUrl: string | null = null;

  try {
    const cookieStore = await cookies();
    const auth = createAuthActions({ cookies: cookieStore });
    const { data, error } = await auth.signInWithOAuth(provider, {
      redirectTo: new URL(CALLBACK_PATH, APP_URL).toString(),
      skipBrowserRedirect: true,
    });

    if (error || !data.url || !data.codeVerifier) {
      console.error("[actions/auth] signInWithProvider", error);
      after(() =>
        logPostHogError("OAuth sign-in preparation failed", { provider }),
      );
    } else {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: OAUTH_COOKIE_MAX_AGE,
      } as const;

      cookieStore.set(CODE_VERIFIER_COOKIE, data.codeVerifier, cookieOptions);
      cookieStore.set(OAUTH_PROVIDER_COOKIE, provider, cookieOptions);
      authUrl = data.url;
      after(() =>
        logPostHogInfo("OAuth sign-in redirect prepared", { provider }),
      );
    }
  } catch (error) {
    console.error("[actions/auth] signInWithProvider", error);
    after(() =>
      logPostHogError("OAuth sign-in preparation failed", { provider }),
    );
  }

  redirect(authUrl ?? LOGIN_ERROR_PATH);
}

export async function signOut(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const auth = createAuthActions({ cookies: cookieStore });
    const { error } = await auth.signOut();

    // The SDK clears the session cookies even when the backend call fails,
    // so the user is signed out locally either way.
    if (error) {
      console.error("[actions/auth] signOut", error);
    }

    // Readable by the browser on purpose: instrumentation-client.ts sees it,
    // resets the PostHog identity and deletes it.
    cookieStore.set(POSTHOG_RESET_COOKIE, "1", {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: POSTHOG_RESET_MAX_AGE,
    });
  } catch (error) {
    console.error("[actions/auth] signOut", error);
  }

  redirect(HOME_PATH);
}
