import { after, NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

import {
  CODE_VERIFIER_COOKIE,
  OAUTH_PROVIDER_COOKIE,
} from "@/lib/insforge-server";
import { logPostHogError, logPostHogInfo } from "@/lib/posthog-logger";
import { captureServerEvent } from "@/lib/posthog-server";
import { DASHBOARD_PATH, LOGIN_ERROR_PATH } from "@/lib/routes";
import { OAUTH_PROVIDERS } from "@/types";

// PostHog calls go through after() so a slow ingestion endpoint never delays
// the redirect back into the app.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const verifier = request.cookies.get(CODE_VERIFIER_COOKIE)?.value;
  const providerCookie = request.cookies.get(OAUTH_PROVIDER_COOKIE)?.value;
  const provider = OAUTH_PROVIDERS.find((name) => name === providerCookie);

  const failure = NextResponse.redirect(new URL(LOGIN_ERROR_PATH, request.url));
  failure.cookies.delete(CODE_VERIFIER_COOKIE);
  failure.cookies.delete(OAUTH_PROVIDER_COOKIE);

  if (!code || !verifier) {
    return failure;
  }

  try {
    const response = NextResponse.redirect(
      new URL(DASHBOARD_PATH, request.url),
    );
    const auth = createAuthActions({
      requestCookies: request.cookies,
      responseCookies: response.cookies,
    });
    const { data, error } = await auth.exchangeOAuthCode(code, verifier);

    if (error) {
      console.error("[callback]", error);
      after(() => logPostHogError("OAuth callback exchange failed"));
      return failure;
    }

    response.cookies.delete(CODE_VERIFIER_COOKIE);
    response.cookies.delete(OAUTH_PROVIDER_COOKIE);

    const userId = data?.user?.id;
    after(async () => {
      await logPostHogInfo("OAuth callback exchange completed");
      if (userId) {
        await captureServerEvent(
          userId,
          "user_signed_in",
          provider ? { provider } : undefined,
        );
      }
    });
    return response;
  } catch (error) {
    console.error("[callback]", error);
    after(() => logPostHogError("OAuth callback exchange failed"));
    return failure;
  }
}
