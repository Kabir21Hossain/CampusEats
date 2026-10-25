import { Suspense } from "react";
import { RoleLayout } from "@/components/layouts/role-layout";

export const metadata = {
  title: "Delivery Rider Portal — CampusEats",
};

export default function RiderLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RoleLayout activeRoleTitle="Rider Hub">{children}</RoleLayout>
    </Suspense>
  );
}
