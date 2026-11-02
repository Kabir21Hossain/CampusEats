import { requirePageRole } from "@/lib/auth-page";

/**
 * Function RolePageGuard.
 * @returns {Promise<*>} Resolves with the operation result.
 */
export async function RolePageGuard({ role, children }) {
  await requirePageRole(role);
  return children;
}
