import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";
import { RolePageGuard } from "@/components/layouts/role-page-guard";
import { ROLES } from "@/lib/constants";

export const metadata = {
  title: "Student Hub — CampusEats",
};

export default function StudentLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RolePageGuard role={ROLES.STUDENT}>
        <RoleLayout activeRoleTitle="Student Portal">{children}</RoleLayout>
      </RolePageGuard>
    </Suspense>
  );
}
