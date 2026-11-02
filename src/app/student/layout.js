import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";

/**
 * Exports metadata.
 * @type {*} Exported application value.
*/
export const metadata = {
  title: "Student Hub — CampusEats",
};

/**
 * Function StudentLayout.
 * @returns {*} The operation result.
 */
export default function StudentLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RoleLayout activeRoleTitle="Student Portal">{children}</RoleLayout>
    </Suspense>
  );
}
