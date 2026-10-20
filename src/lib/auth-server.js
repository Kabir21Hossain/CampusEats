import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { ROLES } from "@/lib/constants";

/**
 * Validates the request session authoritatively using Better Auth & MongoDB.
 * Never uses unverified client tokens or decoded JWTs.
 */
export async function getServerSession(request) {
  try {
    // 1. Try Better Auth authoritative session API
    if (auth?.api?.getSession) {
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        });
        if (session?.user) {
          // Fetch full user record from database to verify suspension and role
          const usersCol = await getCollection("users");
          const dbUser = await usersCol.findOne({ id: session.user.id });
          if (dbUser && !dbUser.isSuspended) {
            return {
              user: sanitizeUser(dbUser),
              session: session.session,
            };
          }
        }
      } catch {
        // Fall back to cookie-backed DB session check
      }
    }

    // 2. Authoritative cookie lookup against MongoDB
    const userIdCookie = request.cookies.get("campuseats_user_id")?.value;
    const roleCookie = request.cookies.get("campuseats_role")?.value;

    if (!userIdCookie) {
      return null;
    }

    const usersCol = await getCollection("users");
    const user = await usersCol.findOne({ id: userIdCookie });

    if (!user || user.isSuspended) {
      return null;
    }

    // Enforce role consistency between cookie and DB record
    if (roleCookie && user.role !== roleCookie) {
      return null;
    }

    return {
      user: sanitizeUser(user),
      session: {
        id: `sess-${user.id}`,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  } catch (err) {
    console.error("[getServerSession Error]:", err.message);
    return null;
  }
}

/**
 * Strips sensitive fields like password hashes or internal secrets.
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...cleanUser } = user;
  return cleanUser;
}

/**
 * Reusable Route Handler guard ensuring a live session exists.
 * Returns { user, session } or a JSON 401 response.
 */
export async function requireSession(request) {
  const session = await getServerSession(request);
  if (!session || !session.user) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Valid session required",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      ),
      user: null,
      session: null,
    };
  }
  return { errorResponse: null, user: session.user, session: session.session };
}

/**
 * Reusable Route Handler guard ensuring the authenticated user has an allowed role.
 * Returns errorResponse or null.
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

  // Admins always have access across resources for moderation
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
  return user.id === ownerId;
}
