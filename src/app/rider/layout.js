import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";

/**
 * Exports metadata.
 * @type {*} Exported application value.
*/
export const metadata = {
  title: "Delivery Rider Portal — CampusEats",
};

/**
 * Function RiderLayout.
 * @returns {*} The operation result.
 */
export default function RiderLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RoleLayout activeRoleTitle="Rider Hub">{children}</RoleLayout>
    </Suspense>
  );
}
