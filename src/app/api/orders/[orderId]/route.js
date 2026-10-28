import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ORDER_STATUS, ROLES } from "@/lib/constants";
import {
  isOrderParticipant,
  isShopOwner,
  isStudentOrderOwner,
  requireSession,
  serializeOrderForUser,
} from "@/lib/auth-server";

export async function GET(request, { params }) {
  try {
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;

    const { orderId } = await params;
    const ordersCol = await getCollection("orders");
    const order = await ordersCol.findOne({ id: orderId });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const shopsCol = user.role === ROLES.SHOP_OWNER
      ? await getCollection("shops")
      : null;
    const shop = shopsCol
      ? await shopsCol.findOne({
          $or: [{ ownerId: user.id }, { ownerUserId: user.id }],
          id: order.shopId,
        })
      : null;
    const isAvailableToRider =
      user.role === ROLES.RIDER &&
      (order.riderId === null || order.riderId === undefined) &&
      (order.riderUserId === null || order.riderUserId === undefined) &&
      [ORDER_STATUS.CONFIRMED, ORDER_STATUS.AWAITING_RIDER].includes(order.status);

    if (!isOrderParticipant(order, user, shop) && !isAvailableToRider) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeOrderForUser(order, user),
    });
  } catch (err) {
    console.error("[Order Detail API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;

    const { orderId } = await params;
    const body = await request.json();
    const ordersCol = await getCollection("orders");

    const order = await ordersCol.findOne({ id: orderId });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found", code: "NOT_FOUND" }, { status: 404 });
    }
    const shopsCol = user.role === ROLES.SHOP_OWNER
      ? await getCollection("shops")
      : null;
    const shop = shopsCol
      ? await shopsCol.findOne({
          $or: [{ ownerId: user.id }, { ownerUserId: user.id }],
          id: order.shopId,
        })
      : null;
    if (!isOrderParticipant(order, user, shop)) {
      return NextResponse.json(
        { success: false, error: "Order not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const updates = {};
    const timestamps = { ...(order.statusTimestamps || {}) };

    // Cancellation request
    if (body.status === ORDER_STATUS.CANCELLED || body.cancelReason) {
      // Cancellation policy: customer can cancel before pickup, or admin/shop owner can cancel
      const isCustomer = isStudentOrderOwner(order, user);
      const isAdmin = user.role === ROLES.ADMIN;
      const isShopManager = isShopOwner(shop, user);

      if (!isCustomer && !isAdmin && !isShopManager) {
        return NextResponse.json(
          { success: false, error: "Order not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      if ([ORDER_STATUS.PICKED_UP, ORDER_STATUS.DELIVERED].includes(order.status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Order cannot be cancelled after pickup. Please open a dispute with administration.",
            code: "CANCEL_POLICY_VIOLATION",
          },
          { status: 409 }
        );
      }

      updates.status = ORDER_STATUS.CANCELLED;
      updates.cancellationReason = body.cancelReason || body.cancellationReason || "Cancelled by user";
      updates.escrowStatus = "refunded";
      timestamps.cancelledAt = now;
      updates.statusTimestamps = timestamps;
    } else if (body.status) {
      // General status update (e.g. shop owner moving to confirmed/preparing)
      const isAdmin = user.role === ROLES.ADMIN;
      const shopManager = isShopOwner(shop, user);

      if (!isAdmin && !shopManager) {
        return NextResponse.json(
          { success: false, error: "Order not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      updates.status = body.status;
      if (body.status === ORDER_STATUS.CONFIRMED) timestamps.confirmedAt = now;
      if (body.status === ORDER_STATUS.AWAITING_RIDER) timestamps.awaitingRiderAt = now;
      updates.statusTimestamps = timestamps;
    }

    // Customer rating submission
    if (body.rating || body.ratingGiven) {
      if (!isStudentOrderOwner(order, user) && user.role !== ROLES.ADMIN) {
        return NextResponse.json(
          { success: false, error: "Order not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
      updates.ratingGiven = {
        ...(body.rating || body.ratingGiven),
        ratedAt: now,
      };
    }

    await ordersCol.updateOne({ id: orderId }, { $set: updates });
    const updated = await ordersCol.findOne({ id: orderId });

    return NextResponse.json({
      success: true,
      data: serializeOrderForUser(updated, user),
    });
  } catch (err) {
    console.error("[Order Update API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
