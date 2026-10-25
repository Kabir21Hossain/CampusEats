import { NextResponse } from "next/server";

/**
 * The Better Auth cookie belongs to the separate API origin, so this frontend
 * cannot use its request cookies for an optimistic auth redirect. RoleLayout
 * checks the API session, while backend routes enforce authorization.
 */
export function proxy(request) {
  void request;
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
