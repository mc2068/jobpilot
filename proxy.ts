import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/find-jobs"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // Collects any refreshed or cleared session cookies so they can be copied
  // onto whichever response we end up returning, including redirects.
  const sessionCookies = NextResponse.next();
  const { accessToken } = await updateSession({
    requestCookies: request.cookies,
    responseCookies: sessionCookies.cookies,
  });

  const { pathname } = request.nextUrl;
  let response: NextResponse;

  if (!accessToken && isProtected(pathname)) {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else if (accessToken && pathname === "/login") {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
    // Passing the request forwards the refreshed cookies to Server Components
    response = NextResponse.next({ request });
  }

  sessionCookies.cookies
    .getAll()
    .forEach((cookie) => response.cookies.set(cookie));

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
