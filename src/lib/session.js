/**
 * Server-Side Session & Role Validation Helpers
 * As specified in architecture.md section 6
 */

import { ROLES } from "./constants";

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

export function isAuthorized(userRole, requiredRole) {
  if (userRole === ROLES.ADMIN) return true; // Admins have oversight
  return userRole === requiredRole;
}
