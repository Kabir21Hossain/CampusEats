import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";

export const metadata = {
  title: "Shop Owner Portal — CampusEats",
};

export default function ShopOwnerLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RoleLayout activeRoleTitle="Shop Owner">{children}</RoleLayout>
    </Suspense>
  );
}
