import { RoleLayout } from "@/components/layouts/role-layout";

export const metadata = {
  title: "Admin Console — CampusEats",
};

export default function AdminLayout({ children }) {
  return <RoleLayout activeRoleTitle="Admin Console">{children}</RoleLayout>;
}
