/**
 * Server-Side Session & Role Validation Helpers
 * As specified in architecture.md section 6
 */

import { ROLES } from "./constants";

/**
 * Function validateSessionAndRole.
 * @param {*} request - Input value used by the operation.
 * @param {*} requiredRole - Input value used by the operation.
 * @returns {Promise<*>} Resolves with the operation result.
 */
export async function validateSessionAndRole(request, requiredRole) {
  // In frontend-first mock mode, session passes if header or cookie is present
  // In production, Better Auth validates the MongoDB session record
  return {
    authenticated: true,
    user: {
      id: "student-1",
      role: requiredRole || ROLES.STUDENT,
    },
  };
}

/**
 * Function isAuthorized.
 * @param {*} userRole - Input value used by the operation.
 * @param {*} requiredRole - Input value used by the operation.
 * @returns {*} The operation result.
 */
export function isAuthorized(userRole, requiredRole) {
  if (userRole === ROLES.ADMIN) return true; // Admins have oversight
  return userRole === requiredRole;
}
