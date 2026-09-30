import { NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

import { CODE_VERIFIER_COOKIE } from "@/lib/insforge-server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const verifier = request.cookies.get(CODE_VERIFIER_COOKIE)?.value;

  const failure = NextResponse.redirect(
    new URL("/login?error=oauth", request.url),
  );
  failure.cookies.delete(CODE_VERIFIER_COOKIE);

  if (!code || !verifier) {
    return failure;
  }

  try {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    const auth = createAuthActions({
      requestCookies: request.cookies,
      responseCookies: response.cookies,
    });
    const { error } = await auth.exchangeOAuthCode(code, verifier);

    if (error) {
      console.error("[callback]", error);
      return failure;
    }

    response.cookies.delete(CODE_VERIFIER_COOKIE);
    return response;
  } catch (error) {
    console.error("[callback]", error);
    return failure;
  }
}
