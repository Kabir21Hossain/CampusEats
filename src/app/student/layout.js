import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";

export const metadata = {
  title: "Student Hub — CampusEats",
};

export default function StudentLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RoleLayout activeRoleTitle="Student Portal">{children}</RoleLayout>
    </Suspense>
  );
}
