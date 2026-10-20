import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ORDER_STATUS, ROLES } from "@/lib/constants";
import { requireSession } from "@/lib/auth-server";

export async function GET(request, { params }) {
  try {
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;

    const { orderId } = await params;
    const ordersCol = await getCollection("orders");
    const order = await ordersCol.findOne((o) => o.id === orderId);

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // IDOR Access Authorization
    const isCustomer = order.customerUserId === user.id;
    const isAssignedRider = order.riderUserId === user.id;
    const isAdmin = user.role === ROLES.ADMIN;

    // Check shop owner authorization
    let isShopOwner = false;
    if (user.role === ROLES.SHOP_OWNER) {
      const shopsCol = await getCollection("shops");
      const shop = await shopsCol.findOne({ id: order.shopId, ownerUserId: user.id });
      isShopOwner = Boolean(shop);
    }

    // Riders can also view unassigned orders in confirmed/awaiting_rider status
    const isEligibleRider =
      user.role === ROLES.RIDER &&
      !order.riderUserId &&
      [ORDER_STATUS.CONFIRMED, ORDER_STATUS.AWAITING_RIDER].includes(order.status);

    if (!isCustomer && !isAssignedRider && !isShopOwner && !isAdmin && !isEligibleRider) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You do not have permission to view this order",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;

    const { orderId } = await params;
    const body = await request.json();
    const ordersCol = await getCollection("orders");

    const order = await ordersCol.findOne((o) => o.id === orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updates = {};
    const timestamps = { ...(order.statusTimestamps || {}) };

    // Cancellation request
    if (body.status === ORDER_STATUS.CANCELLED || body.cancelReason) {
      // Cancellation policy: customer can cancel before pickup, or admin/shop owner can cancel
      const isCustomer = order.customerUserId === user.id;
      const isAdmin = user.role === ROLES.ADMIN;

      if (!isCustomer && !isAdmin && user.role !== ROLES.SHOP_OWNER) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Unauthorized to cancel this order", code: "FORBIDDEN" },
          { status: 403 }
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
      const isShopOwner = user.role === ROLES.SHOP_OWNER;

      if (!isAdmin && !isShopOwner) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Only shop managers or admins can update order status", code: "FORBIDDEN" },
          { status: 403 }
        );
      }

      updates.status = body.status;
      if (body.status === ORDER_STATUS.CONFIRMED) timestamps.confirmedAt = now;
      if (body.status === ORDER_STATUS.AWAITING_RIDER) timestamps.awaitingRiderAt = now;
      updates.statusTimestamps = timestamps;
    }

    // Customer rating submission
    if (body.rating || body.ratingGiven) {
      if (order.customerUserId !== user.id && user.role !== ROLES.ADMIN) {
        return NextResponse.json(
          { success: false, error: "Only the customer who placed this order can submit ratings", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
      updates.ratingGiven = {
        ...(body.rating || body.ratingGiven),
        ratedAt: now,
      };
    }

    await ordersCol.updateOne((o) => o.id === orderId, updates);
    const updated = await ordersCol.findOne((o) => o.id === orderId);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
