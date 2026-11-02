import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { ROLES } from "@/lib/constants";

const dashboardByRole = {
  [ROLES.STUDENT]: "/student/home",
  [ROLES.SHOP_OWNER]: "/shop-owner/dashboard",
  [ROLES.RIDER]: "/rider/available-orders",
  [ROLES.ADMIN]: "/admin/dashboard",
};

/**
 * Function requirePageRole.
 * @param {*} requiredRole - Input value used by the operation.
 * @returns {Promise<*>} Resolves with the operation result.
 */
export async function requirePageRole(requiredRole) {
  const requestHeaders = await headers();
  const sessionData = await getServerSession({ headers: requestHeaders });

  if (!sessionData) {
    redirect("/signin");
  }

  const userRole = sessionData.user.role;
  if (userRole !== requiredRole && userRole !== ROLES.ADMIN) {
    redirect(dashboardByRole[userRole] || "/signin");
  }
}
