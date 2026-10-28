import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ORDER_STATUS, ROLES } from "@/lib/constants";
import {
  requireSession,
  requireRole,
  serializeOrderForUser,
} from "@/lib/auth-server";

export async function POST(request) {
  try {
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;

    const roleErr = requireRole(user, [ROLES.RIDER, ROLES.ADMIN]);
    if (roleErr) return roleErr;

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing order ID", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const ordersCol = await getCollection("orders");
    const existingOrder = await ordersCol.findOne({ id: orderId });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Both current and legacy rider fields must be empty before a claim.
    const now = new Date().toISOString();
    const claimResult = await ordersCol.updateOne(
      {
        id: orderId,
        status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.AWAITING_RIDER] },
        $and: [
          { $or: [{ riderId: null }, { riderId: { $exists: false } }] },
          { $or: [{ riderUserId: null }, { riderUserId: { $exists: false } }] },
        ],
      },
      {
        $set: {
          riderId: user.id,
          riderUserId: user.id,
          riderName: user.name,
          riderPhone: user.phone || "+880 1911-223344",
          status: ORDER_STATUS.CLAIMED,
          "statusTimestamps.claimedAt": now,
        },
      }
    );

    // If no document was modified, another rider claimed it or status changed
    if (claimResult.matchedCount === 0 && claimResult.modifiedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Conflict: This order has already been claimed by another rider or is no longer available.",
          code: "CONFLICT",
        },
        { status: 409 }
      );
    }

    const updated = await ordersCol.findOne({ id: orderId });
    return NextResponse.json({
      success: true,
      data: serializeOrderForUser(updated, user),
      message: "Order claimed successfully",
    });
  } catch (err) {
    console.error("[Rider Claim API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
