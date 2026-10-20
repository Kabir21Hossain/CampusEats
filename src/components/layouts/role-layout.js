"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ROLES } from "@/lib/constants";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { DemoRoleBanner } from "@/components/shared/demo-role-banner";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export function RoleLayout({ children, activeRoleTitle }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAuthenticated, mounted } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    // Check permissions
    if (pathname.startsWith("/student") && role !== ROLES.STUDENT && role !== ROLES.ADMIN) {
      toast.error("Access Restricted: Student Portal is only accessible to students.");
      if (role === ROLES.SHOP_OWNER) router.push("/shop-owner/dashboard");
      else if (role === ROLES.RIDER) router.push("/rider/available-orders");
      else router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      setAuthorized(false);
      return;
    }

    if (pathname.startsWith("/shop-owner") && role !== ROLES.SHOP_OWNER && role !== ROLES.ADMIN) {
      toast.error("Access Restricted: Shop Owner Portal is only accessible to canteen owners.");
      if (role === ROLES.STUDENT) router.push("/student/home");
      else if (role === ROLES.RIDER) router.push("/rider/available-orders");
      else router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      setAuthorized(false);
      return;
    }

    if (pathname.startsWith("/rider") && role !== ROLES.RIDER && role !== ROLES.ADMIN) {
      toast.error("Access Restricted: Rider Portal is only accessible to registered delivery riders.");
      if (role === ROLES.STUDENT) router.push("/student/home");
      else if (role === ROLES.SHOP_OWNER) router.push("/shop-owner/dashboard");
      else router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      setAuthorized(false);
      return;
    }

    if (pathname.startsWith("/admin") && role !== ROLES.ADMIN) {
      toast.error("Access Restricted: Admin Console is strictly restricted to university administrators.");
      if (role === ROLES.STUDENT) router.push("/student/home");
      else if (role === ROLES.SHOP_OWNER) router.push("/shop-owner/dashboard");
      else if (role === ROLES.RIDER) router.push("/rider/available-orders");
      else router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      setAuthorized(false);
      return;
    }

    setAuthorized(true);
  }, [pathname, role, mounted, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf8] dark:bg-[#0d1511]">
        <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
      <DemoRoleBanner />
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
