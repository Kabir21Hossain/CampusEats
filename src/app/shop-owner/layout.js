import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";
import { RolePageGuard } from "@/components/layouts/role-page-guard";
import { ROLES } from "@/lib/constants";

export const metadata = {
  title: "Shop Owner Portal — CampusEats",
};

export default function ShopOwnerLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RolePageGuard role={ROLES.SHOP_OWNER}>
        <RoleLayout activeRoleTitle="Shop Owner">{children}</RoleLayout>
      </RolePageGuard>
    </Suspense>
  );
}
