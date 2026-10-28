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

    // State machine check: must be picked up before delivery
    if (order.status !== ORDER_STATUS.PICKED_UP) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot complete delivery for order in status '${order.status}'. Order must be picked up first.`,
          code: "INVALID_STATE_TRANSITION",
        },
        { status: 409 }
      );
    }

    // Verify 4-digit customer receipt code
    if (order.deliveryVerificationCode !== inputCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid delivery code. Please verify with the student recipient.",
          code: "INVALID_CODE",
        },
        { status: 422 }
      );
    }

    const now = new Date().toISOString();
    const updates = {
      status: ORDER_STATUS.DELIVERED,
      escrowStatus: "released",
      paymentStatus: "paid",
      statusTimestamps: {
        ...(order.statusTimestamps || {}),
        deliveredAt: now,
      },
    };

    await ordersCol.updateOne({ id: orderId }, { $set: updates });
    const updated = await ordersCol.findOne({ id: orderId });

    // Credit rider wallet notification
    const notifsCol = await getCollection("notifications");
    await notifsCol.insertOne({
      id: `notif-${Date.now()}`,
      userId: order.riderUserId || user.id,
      title: "Delivery Earnings Credited! ৳30",
      body: `Delivery earnings for Order #${order.id} have been released to your bKash wallet.`,
      type: "earnings",
      deepLink: "/rider/earnings",
      isRead: false,
      createdAt: now,
    });

    // Send customer delivery completion receipt email
    (async () => {
      try {
        const usersCol = await getCollection("user");
        const customer = await usersCol.findOne(userIdFilter(order.customerUserId));
        if (customer?.email) {
          const emailData = emailTemplates.orderDeliveredCustomer(updated, customer);
          await sendEmail({
            to: customer.email,
            subject: emailData.subject,
            html: emailData.html,
          });
        }
      } catch (emailErr) {
        console.warn("[Delivery completion email warning]:", emailErr.message);
      }
    })();

    return NextResponse.json({
      success: true,
      data: serializeOrderForUser(updated, user),
    });
  } catch (err) {
    console.error("[Rider Delivery API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
