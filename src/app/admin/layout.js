import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";

/**
 * Exports metadata.
 * @type {*} Exported application value.
*/
export const metadata = {
  title: "Admin Console — CampusEats",
};

/**
 * Function AdminLayout.
 * @returns {*} The operation result.
 */
export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RoleLayout activeRoleTitle="Admin Console">{children}</RoleLayout>
    </Suspense>
  );
}
