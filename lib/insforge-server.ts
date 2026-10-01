import { cookies } from "next/headers";
import type { InsForgeClient } from "@insforge/sdk";
import {
  createServerClient,
  getAccessTokenCookieName,
} from "@insforge/sdk/ssr";

export const CODE_VERIFIER_COOKIE = "insforge_code_verifier";
// Remembers which provider started the flow so /callback can report it.
export const OAUTH_PROVIDER_COOKIE = "oauth_provider";

export async function createInsforgeServer(): Promise<InsForgeClient> {
  return createServerClient({ cookies: await cookies() });
}

// proxy.ts refreshes or clears the session before any page renders, so the
// cookie alone is a reliable optimistic check. A failed refresh leaves an
// empty value behind, hence the value check rather than has().
export async function hasSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(getAccessTokenCookieName())?.value);
}
