import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ORDER_STATUS, ROLES } from "@/lib/constants";
import {
  isAssignedRider,
  requireSession,
  requireRole,
  serializeOrderForUser,
  userIdFilter,
} from "@/lib/auth-server";
import { sendEmail, emailTemplates } from "@/lib/email/mailer";

export async function POST(request) {
  try {
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;

    const roleErr = requireRole(user, [ROLES.RIDER, ROLES.ADMIN]);
    if (roleErr) return roleErr;

    const body = await request.json();
    const { orderId, verificationCode, code } = body;
    const inputCode = (verificationCode || code || "").trim();

    if (!orderId || !inputCode) {
      return NextResponse.json(
        { success: false, error: "Missing order ID or verification code", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const ordersCol = await getCollection("orders");
    const order = await ordersCol.findOne({ id: orderId });
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!isAssignedRider(order, user)) {
      return NextResponse.json(
        { success: false, error: "Order not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // State machine guard: order must be claimed before pickup
    if (order.status !== ORDER_STATUS.CLAIMED) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot pickup order in status '${order.status}'. Order must be claimed first.`,
          code: "INVALID_STATE_TRANSITION",
        },
        { status: 409 }
      );
    }

    // Verify 4-digit counter code
    if (order.pickupVerificationCode !== inputCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pickup verification code. Please verify with canteen staff.",
          code: "INVALID_CODE",
        },
        { status: 422 }
      );
    }

    const now = new Date().toISOString();
    const updates = {
      status: ORDER_STATUS.PICKED_UP,
      statusTimestamps: {
        ...(order.statusTimestamps || {}),
        pickedUpAt: now,
      },
    };

    await ordersCol.updateOne({ id: orderId }, { $set: updates });
    const updated = await ordersCol.findOne({ id: orderId });

    // Trusted dual-notification: Customer + Shop Owner
    // Enqueue asynchronously so email issues do not fail the order update
    (async () => {
      try {
        const usersCol = await getCollection("user");
        const shopsCol = await getCollection("shops");

        // 1. Customer record
        const customer = await usersCol.findOne(userIdFilter(order.customerUserId));
        if (customer?.email) {
          const custEmail = emailTemplates.orderPickedUpCustomer(updated, customer, user);
          await sendEmail({
            to: customer.email,
            subject: custEmail.subject,
            html: custEmail.html,
          });
        }

        // 2. Shop Owner record
        const shop = await shopsCol.findOne({ id: order.shopId });
        const shopOwnerId = shop?.ownerId || shop?.ownerUserId;
        if (shopOwnerId) {
          const shopOwner = await usersCol.findOne(userIdFilter(shopOwnerId));
          if (shopOwner?.email) {
            const shopEmail = emailTemplates.orderPickedUpShopOwner(updated, shopOwner, user);
            await sendEmail({
              to: shopOwner.email,
              subject: shopEmail.subject,
              html: shopEmail.html,
            });
          }
        }
      } catch (emailErr) {
        console.warn("[Dual-notification Warning]:", emailErr.message);
      }
    })();

    return NextResponse.json({
      success: true,
      data: serializeOrderForUser(updated, user),
    });
  } catch (err) {
    console.error("[Rider Pickup API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
