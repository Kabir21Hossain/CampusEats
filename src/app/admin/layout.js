import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";
import { RolePageGuard } from "@/components/layouts/role-page-guard";
import { ROLES } from "@/lib/constants";

export const metadata = {
  title: "Admin Console — CampusEats",
};

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RolePageGuard role={ROLES.ADMIN}>
        <RoleLayout activeRoleTitle="Admin Console">{children}</RoleLayout>
      </RolePageGuard>
    </Suspense>
  );
}
