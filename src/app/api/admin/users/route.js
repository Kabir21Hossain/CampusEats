import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import {
  requireAdminSession,
  sanitizeUser,
  userIdFilter,
} from "@/lib/auth-server";

export async function GET(request) {
  try {
    const { user, errorResponse } = await requireAdminSession(request);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const usersCol = await getCollection("user");
    let users = await usersCol.find();

    if (role && role !== "all") {
      users = users.filter((u) => u.role === role);
    }

    return NextResponse.json({ success: true, data: users.map(sanitizeUser) });
  } catch (err) {
    console.error("[Admin Users Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { user, errorResponse } = await requireAdminSession(request);
    if (errorResponse) return errorResponse;

    const { userId, reason } = await request.json();
    if (typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json(
        { success: false, error: "A valid user ID is required.", code: "INVALID_USER_ID" },
        { status: 422 }
      );
    }
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: "Administrators cannot suspend themselves.", code: "SELF_SUSPENSION" },
        { status: 409 }
      );
    }

    const usersCol = await getCollection("user");
    const target = await usersCol.findOne(userIdFilter(userId));
    if (!target) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const targetId = target.id ?? target._id?.toString();
    const nextSuspended = !target.isSuspended;
    const updates = {
      isSuspended: nextSuspended,
      suspensionReason: nextSuspended
        ? String(reason || "Administrative action").trim().slice(0, 500)
        : null,
      updatedAt: new Date().toISOString(),
    };

    await usersCol.updateOne(userIdFilter(targetId), { $set: updates });
    const updated = await usersCol.findOne(userIdFilter(targetId));

    return NextResponse.json({ success: true, data: sanitizeUser(updated) });
  } catch (err) {
    console.error("[Admin Users Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
