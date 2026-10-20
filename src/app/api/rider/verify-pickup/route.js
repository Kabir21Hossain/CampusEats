import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ORDER_STATUS, ROLES } from "@/lib/constants";
import { requireSession, requireRole } from "@/lib/auth-server";
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
    const order = await ordersCol.findOne((o) => o.id === orderId);
    if (!order) {
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

    // Authorization: only the assigned rider (or admin) can pickup
    if (user.role !== ROLES.ADMIN && order.riderUserId && order.riderUserId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You are not the assigned rider for this delivery",
          code: "FORBIDDEN",
        },
        { status: 403 }
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

    await ordersCol.updateOne((o) => o.id === orderId, updates);
    const updated = await ordersCol.findOne((o) => o.id === orderId);

    // Trusted dual-notification: Customer + Shop Owner
    // Enqueue asynchronously so email issues do not fail the order update
    (async () => {
      try {
        const usersCol = await getCollection("users");
        const shopsCol = await getCollection("shops");

        // 1. Customer record
        const customer = await usersCol.findOne((u) => u.id === order.customerUserId);
        if (customer?.email) {
          const custEmail = emailTemplates.orderPickedUpCustomer(updated, customer, user);
          await sendEmail({
            to: customer.email,
            subject: custEmail.subject,
            html: custEmail.html,
          });
        }

        // 2. Shop Owner record
        const shop = await shopsCol.findOne((s) => s.id === order.shopId);
        if (shop?.ownerUserId) {
          const shopOwner = await usersCol.findOne((u) => u.id === shop.ownerUserId);
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

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
