import { RoleLayout } from "@/components/layouts/role-layout";

export const metadata = {
  title: "Student Hub — CampusEats",
};

export default function StudentLayout({ children }) {
  return <RoleLayout activeRoleTitle="Student Portal">{children}</RoleLayout>;
}
