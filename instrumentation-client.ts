import { getAccessTokenCookieName } from "@insforge/sdk/ssr/middleware";
import posthog from "posthog-js";

import { captureEvent } from "@/lib/posthog-client";
import { POSTHOG_RESET_COOKIE } from "@/lib/posthog-shared";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let isInitialized = false;

function readCookie(name: string): string | null {
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  return entry ? entry.slice(name.length + 1) : null;
}

// The signOut Server Action leaves POSTHOG_RESET_COOKIE behind. Its redirect
// is a client-side navigation, so this file does not re-run and no hashchange
// fires. A cookie survives either kind of navigation.
function resetAfterSignOut(): void {
  if (!readCookie(POSTHOG_RESET_COOKIE)) {
    return;
  }

  document.cookie = `${POSTHOG_RESET_COOKIE}=; path=/; max-age=0`;
  // Captured before reset() so the event still belongs to the signed-in user.
  captureEvent("user_signed_out");
  posthog.reset();
}

async function identifyCurrentUser(): Promise<void> {
  // proxy.ts refreshed or cleared the session for this page load, so an empty
  // cookie means a signed-out visitor and the request can be skipped.
  if (!readCookie(getAccessTokenCookieName())) {
    return;
  }

  try {
    // Imported lazily: creating the browser client immediately attempts a
    // session refresh, which signed-out visitors should not trigger.
    const { insforge } = await import("@/lib/insforge-client");
    const { data, error } = await insforge.auth.getCurrentUser();
    const user = data?.user;

    if (error || !user) {
      return;
    }

    posthog.identify(user.id, {
      email: user.email,
      ...(user.profile?.name ? { name: user.profile.name } : {}),
    });
  } catch (error) {
    console.error("[PostHog] Failed to identify the current user", error);
  }
}

export function onRouterTransitionStart(): void {
  if (isInitialized) {
    resetAfterSignOut();
  }
}

if (!posthogKey) {
  if (process.env.NODE_ENV === "development") {
    throw new Error(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
    );
  }
} else if (!posthogHost) {
  if (process.env.NODE_ENV === "development") {
    throw new Error(
      "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured",
    );
  }
} else if (typeof window !== "undefined") {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    defaults: "2026-01-30",
    capture_exceptions: true,
  });
  isInitialized = true;

  resetAfterSignOut();
  void identifyCurrentUser();
}
