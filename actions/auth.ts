"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";

import { CODE_VERIFIER_COOKIE } from "@/lib/insforge-server";
import type { OAuthProvider } from "@/types";

const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "github"];
const LOGIN_ERROR_PATH = "/login?error=oauth";

// Both actions end in a redirect, so they return nothing — redirect() must be
// called outside try/catch because it works by throwing.
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
      redirectTo: new URL(
        "/callback",
        process.env.NEXT_PUBLIC_APP_URL,
      ).toString(),
      skipBrowserRedirect: true,
    });

    if (error || !data.url || !data.codeVerifier) {
      console.error("[actions/auth] signInWithProvider", error);
    } else {
      cookieStore.set(CODE_VERIFIER_COOKIE, data.codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      });
      authUrl = data.url;
    }
  } catch (error) {
    console.error("[actions/auth] signInWithProvider", error);
  }

  redirect(authUrl ?? LOGIN_ERROR_PATH);
}

export async function signOut(): Promise<void> {
  try {
    const auth = createAuthActions({ cookies: await cookies() });
    const { error } = await auth.signOut();

    // The SDK clears the session cookies even when the backend call fails,
    // so the user is signed out locally either way.
    if (error) {
      console.error("[actions/auth] signOut", error);
    }
  } catch (error) {
    console.error("[actions/auth] signOut", error);
  }

  redirect("/");
}
