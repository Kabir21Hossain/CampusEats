import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";

/**
 * Exports metadata.
 * @type {*} Exported application value.
*/
export const metadata = {
  title: "Shop Owner Portal — CampusEats",
};

/**
 * Function ShopOwnerLayout.
 * @returns {*} The operation result.
 */
export default function ShopOwnerLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RoleLayout activeRoleTitle="Shop Owner">{children}</RoleLayout>
    </Suspense>
  );
}
