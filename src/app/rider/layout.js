import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";
import { RolePageGuard } from "@/components/layouts/role-page-guard";
import { ROLES } from "@/lib/constants";

export const metadata = {
  title: "Delivery Rider Portal — CampusEats",
};

export default function RiderLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RolePageGuard role={ROLES.RIDER}>
        <RoleLayout activeRoleTitle="Rider Hub">{children}</RoleLayout>
      </RolePageGuard>
    </Suspense>
  );
}
