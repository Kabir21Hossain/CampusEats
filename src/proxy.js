import { NextResponse } from "next/server";

/**
 * Server-Side Route Guard & Proxy (Next.js 16 file convention)
 * Provides early page navigation protection and prevents unauthenticated access
 * to protected role areas (/student, /shop-owner, /rider, /admin).
 *
 * Full authoritative authorization & IDOR protection is enforced server-side
 * on every Route Handler and server component via auth-server.js.
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Better Auth session token cookies (standard and secure)
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuth = Boolean(sessionToken);

  const redirect = (urlPath) =>
    NextResponse.redirect(new URL(urlPath, request.url));

  const protectedPrefixes = ["/student", "/shop-owner", "/rider", "/admin"];
  const isProtectedPath = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // 1. Unauthenticated users visiting protected pages are redirected to login with redirect param
  if (isProtectedPath && !isAuth) {
    return redirect(`/signin?redirect=${encodeURIComponent(pathname)}`);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/student/:path*",
    "/shop-owner/:path*",
    "/rider/:path*",
    "/admin/:path*",
  ],
};
