import { NextResponse } from "next/server.js";
import { ObjectId } from "mongodb";
import { auth } from "./auth.js";
import { ROLES } from "./constants.js";
import { getCollection } from "./db.js";

export function userIdFilter(id) {
  if (typeof id !== "string" || !id) return { _id: null };
  if (!ObjectId.isValid(id)) return { $or: [{ _id: id }, { id }] };
  return {
    $or: [
      { _id: new ObjectId(id) },
      { _id: id },
      { id },
    ],
  };
}

function isActiveAccount(user) {
  return Boolean(
    user &&
    user.isSuspended !== true &&
    user.isActive !== false &&
    !user.deactivatedAt &&
    !["suspended", "deactivated", "disabled"].includes(
      String(user.accountStatus || "").toLowerCase()
    )
  );
}

/**
 * Validates the request session authoritatively using Better Auth & MongoDB.
 * Never trusts unverified client tokens, decoded JWTs, or client-supplied IDs.
 */
export async function getServerSession(request) {
  const headers = request?.headers || new Headers();
  const session = await auth.api.getSession({ headers });
  if (!session?.user) return null;

  const users = await getCollection("user");
  const user = await users.findOne(userIdFilter(session.user.id));
  if (!user) return null;

  const persistedUser = sanitizeUser({
    ...user,
    id: user.id ?? session.user.id,
  });
  const inactive =
    !isActiveAccount(persistedUser) ||
    persistedUser.isApproved === false ||
    ["pending", "rejected"].includes(persistedUser.verificationStatus);

  return {
    user: inactive ? null : persistedUser,
    session: session.session,
    inactive,
  }
}

/**
 * Strips sensitive fields like password hashes or internal secrets.
 */
export function sanitizeUser(user) {
  if (!user) return null;
  const cleanUser = { ...user };
  delete cleanUser._id;
  delete cleanUser.password;
  delete cleanUser.passwordHash;
  delete cleanUser.bkashNumber;
  return cleanUser;
}

/**
 * Reusable Route Handler guard ensuring a live Better Auth session exists.
 * Returns { user, session } or a JSON 401 response.
 */
export async function requireSession(request) {
  let sessionData;
  try {
    sessionData = await getServerSession(request);
  } catch (error) {
    console.error("[requireSession Error]:", error.name || "Error");
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Unable to verify the session.",
          code: "AUTHENTICATION_UNAVAILABLE",
        },
        { status: 500 }
      ),
      user: null,
      session: null,
    };
  }
  if (sessionData?.inactive) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "This account is not active.",
          code: "ACCOUNT_INACTIVE",
        },
        { status: 403 }
      ),
      user: null,
      session: null,
    };
  }
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

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden.",
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }

  return null;
}

export async function requireAdminSession(request) {
  const sessionResult = await requireSession(request);
  if (sessionResult.errorResponse) return sessionResult;

  const errorResponse = requireRole(sessionResult.user, [ROLES.ADMIN]);
  return errorResponse
    ? { user: null, session: null, errorResponse }
    : sessionResult;
}

export function isShopOwner(shop, user) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role !== ROLES.SHOP_OWNER || typeof user.id !== "string" || !user.id) {
    return false;
  }
  return [shop?.ownerId, shop?.ownerUserId].includes(user.id);
}

export function isAssignedRider(order, user) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role !== ROLES.RIDER || typeof user.id !== "string" || !user.id) {
    return false;
  }
  return [order?.riderId, order?.riderUserId].includes(user.id);
}

export function isStudentOrderOwner(order, user) {
  return Boolean(
    order &&
    user?.role === ROLES.STUDENT &&
    typeof user.id === "string" &&
    user.id &&
    [order.studentId, order.customerUserId].includes(user.id)
  );
}

export function isOrderParticipant(order, user, shop = null) {
  if (!order || !user || typeof user.id !== "string" || !user.id) return false;
  return (
    user.role === ROLES.ADMIN ||
    isStudentOrderOwner(order, user) ||
    isAssignedRider(order, user) ||
    (user.role === ROLES.SHOP_OWNER &&
      ([order.shopOwnerId, order.shopOwnerUserId].includes(user.id) ||
        isShopOwner(shop, user)))
  );
}

export function serializeOrderForUser(order, user) {
  const visibleOrder = { ...order };
  const shopCodeFields = [
    "pickupVerificationCode",
    "pickupCode",
    "pickupOtp",
    "shopHandoverCode",
    "shopHandoverCodeHash",
    "shopHandoverCodeEncrypted",
  ];
  const deliveryCodeFields = [
    "deliveryVerificationCode",
    "deliveryCode",
    "deliveryOtp",
    "studentDeliveryCode",
    "deliveryCodeHash",
    "deliveryCodeEncrypted",
    "studentDeliveryCodeHash",
    "studentDeliveryCodeEncrypted",
  ];

  if (user?.role !== ROLES.STUDENT) {
    for (const field of deliveryCodeFields) delete visibleOrder[field];
  }
  if (user?.role !== ROLES.SHOP_OWNER) {
    for (const field of shopCodeFields) delete visibleOrder[field];
  }
  if ([ROLES.RIDER, ROLES.ADMIN].includes(user?.role)) {
    for (const field of [...shopCodeFields, ...deliveryCodeFields]) {
      delete visibleOrder[field];
    }
  }

  return visibleOrder;
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
