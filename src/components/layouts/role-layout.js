"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ROLES } from "@/lib/constants";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { DemoRoleBanner } from "@/components/shared/demo-role-banner";
import { ShieldAlert } from "lucide-react";

function RoleLayoutInner({ children, activeRoleTitle }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    role,
    isAuthenticated,
    isPending,
    mounted,
    routeToRolePage,
  } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isPending || !mounted) {
      setAuthorized(false);
      return;
    }

    const requiredRole = pathname.startsWith("/student")
      ? ROLES.STUDENT
      : pathname.startsWith("/shop-owner")
      ? ROLES.SHOP_OWNER
      : pathname.startsWith("/rider")
      ? ROLES.RIDER
      : ROLES.ADMIN;

    if (!isAuthenticated) {
      router.replace(`/signin?redirect=${encodeURIComponent(pathname)}`);
      setAuthorized(false);
      return;
    }

    if (
      currentUser?.isApproved === false ||
      currentUser?.verificationStatus === "pending" ||
      currentUser?.verificationStatus === "rejected"
    ) {
      const type = currentUser.role === ROLES.SHOP_OWNER ? "shop" : "rider";
      const status =
        currentUser.verificationStatus === "rejected" ? "rejected" : "pending";
      router.replace(
        `/verification-status?type=${type}&status=${status}&name=${encodeURIComponent(currentUser.shopName || currentUser.name || "your application")}`
      );
      setAuthorized(false);
      return;
    }

    if (role !== requiredRole && role !== ROLES.ADMIN) {
      routeToRolePage(role);
      setAuthorized(false);
      return;
    }

    setAuthorized(true);
  }, [
    currentUser,
    isAuthenticated,
    isPending,
    mounted,
    pathname,
    role,
    routeToRolePage,
    router,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee] transition-colors">
      <DemoRoleBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!authorized ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Verifying Authorization...
            </h2>
            <p className="text-xs text-zinc-500 max-w-sm">
              Checking your Better Auth role permissions against server records.
            </p>
          </div>
        ) : (
          children
        )}
      </main>

      <Footer />
    </div>
  );
}

export function RoleLayout(props) {
  return (
    <Suspense fallback={null}>
      <RoleLayoutInner {...props} />
    </Suspense>
  );
}
