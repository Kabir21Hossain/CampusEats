import { NextResponse } from "next/server.js";
import { auth } from "./auth.js";
import { ROLES } from "./constants.js";

/**
 * Validates the request session authoritatively using Better Auth & MongoDB.
 * Never trusts unverified client tokens, decoded JWTs, or client-supplied IDs.
 */
export async function getServerSession(request) {
  try {
    let headers;
    if (request && request.headers) {
      headers = request.headers;
    } else {
      headers = new Headers();
    }

    const session = await auth.api.getSession({
      headers,
    });

    if (!session || !session.user) {
      return null;
    }

    if (session.user.isSuspended) {
      return null;
    }

    return {
      user: sanitizeUser(session.user),
      session: session.session,
    };
  } catch (err) {
    console.error("[getServerSession Error]:", err.message);
    return null;
  }
}

/**
 * Strips sensitive fields like password hashes or internal secrets.
 */
export function sanitizeUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...cleanUser } = user;
  return cleanUser;
}

/**
 * Reusable Route Handler guard ensuring a live Better Auth session exists.
 * Returns { user, session } or a JSON 401 response.
 */
export async function requireSession(request) {
  const sessionData = await getServerSession(request);
  if (!sessionData || !sessionData.user) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Valid Better Auth session required",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      ),
      user: null,
      session: null,
    };
  }
  return {
    errorResponse: null,
    user: sessionData.user,
    session: sessionData.session,
  };
}

/**
 * Reusable Route Handler guard ensuring the authenticated user has an allowed role.
 * Returns errorResponse (NextResponse) or null if authorized.
 */
export function requireRole(user, allowedRoles = []) {
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Missing session",
        code: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  }

  // Admins have access across resources for moderation and audits
  if (user.role === ROLES.ADMIN) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden: Access restricted for role '${user.role}'`,
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * IDOR Protection: Verifies resource ownership.
 * Allows resource owner OR platform administrator.
 */
export function assertOwnership(ownerId, user) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return user.id === ownerId || user._id === ownerId;
}
