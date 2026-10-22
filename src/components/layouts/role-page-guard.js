import { requirePageRole } from "@/lib/auth-page";

export async function RolePageGuard({ role, children }) {
  await requirePageRole(role);
  return children;
}
