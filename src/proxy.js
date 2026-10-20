import { NextResponse } from "next/server";

/**
 * Server-Side Route Guard & Proxy
 * Strictly enforces that each role can ONLY access their related portal.
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("campuseats_role")?.value;
  const userId = request.cookies.get("campuseats_user_id")?.value;

  const isAuth = Boolean(role && userId);

  // Helper to redirect
  const redirect = (urlPath) => NextResponse.redirect(new URL(urlPath, request.url));

  // 1. Student Portal Restrictions
  if (pathname.startsWith("/student")) {
    if (!isAuth) {
      return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (role !== "student" && role !== "admin") {
      if (role === "shop_owner") return redirect("/shop-owner/dashboard");
      if (role === "rider") return redirect("/rider/available-orders");
      return redirect("/login");
    }
  }

  // 2. Shop Owner Portal Restrictions
  if (pathname.startsWith("/shop-owner")) {
    if (!isAuth) {
      return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (role !== "shop_owner" && role !== "admin") {
      if (role === "student") return redirect("/student/home");
      if (role === "rider") return redirect("/rider/available-orders");
      return redirect("/login");
    }
  }

  // 3. Rider Portal Restrictions
  if (pathname.startsWith("/rider")) {
    if (!isAuth) {
      return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (role !== "rider" && role !== "admin") {
      if (role === "student") return redirect("/student/home");
      if (role === "shop_owner") return redirect("/shop-owner/dashboard");
      return redirect("/login");
    }
  }

  // 4. Admin Portal Restrictions
  if (pathname.startsWith("/admin")) {
    if (!isAuth) {
      return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (role !== "admin") {
      if (role === "student") return redirect("/student/home");
      if (role === "shop_owner") return redirect("/shop-owner/dashboard");
      if (role === "rider") return redirect("/rider/available-orders");
      return redirect("/login");
    }
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
