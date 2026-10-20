import { RoleLayout } from "@/components/layouts/role-layout";

export const metadata = {
  title: "Delivery Rider Portal — CampusEats",
};

export default function RiderLayout({ children }) {
  return <RoleLayout activeRoleTitle="Rider Hub">{children}</RoleLayout>;
}
