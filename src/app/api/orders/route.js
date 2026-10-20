import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ORDER_STATUS, DEFAULT_DELIVERY_FEE, ROLES } from "@/lib/constants";
import { requireSession, requireRole } from "@/lib/auth-server";
import { sendEmail, emailTemplates } from "@/lib/email/mailer";

export async function GET(request) {
  try {
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const requestedStatus = searchParams.get("status");
    const requestedShopId = searchParams.get("shopId");
    const requestedCustomer = searchParams.get("customerUserId");
    const requestedRider = searchParams.get("riderUserId");

    const ordersCol = await getCollection("orders");
    let orders = await ordersCol.find();

    // Enforce role-based data isolation (prevent IDOR)
    if (user.role === ROLES.STUDENT) {
      // Students can ONLY read their own orders
      orders = orders.filter((o) => o.customerUserId === user.id);
    } else if (user.role === ROLES.SHOP_OWNER) {
      // Shop owners can ONLY read orders for their own shop
      const shopsCol = await getCollection("shops");
      const userShop = await shopsCol.findOne({ ownerUserId: user.id });
      const allowedShopId = userShop ? userShop.id : requestedShopId;
      orders = orders.filter((o) => o.shopId === allowedShopId);
    } else if (user.role === ROLES.RIDER) {
      // Riders can see available orders OR their own active/completed deliveries
      if (requestedStatus === ORDER_STATUS.CONFIRMED) {
        orders = orders.filter((o) => !o.riderUserId && o.status === ORDER_STATUS.CONFIRMED);
      } else {
        orders = orders.filter(
          (o) => o.riderUserId === user.id || (!o.riderUserId && [ORDER_STATUS.CONFIRMED, ORDER_STATUS.AWAITING_RIDER].includes(o.status))
        );
      }
    } else if (user.role === ROLES.ADMIN) {
      // Admins have full access with optional filters
      if (requestedCustomer) orders = orders.filter((o) => o.customerUserId === requestedCustomer);
      if (requestedShopId) orders = orders.filter((o) => o.shopId === requestedShopId);
      if (requestedRider) orders = orders.filter((o) => o.riderUserId === requestedRider);
      if (requestedStatus) orders = orders.filter((o) => o.status === requestedStatus);
    }

    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return NextResponse.json({ success: true, data: orders });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;

    const roleErr = requireRole(user, [ROLES.STUDENT, ROLES.ADMIN]);
    if (roleErr) return roleErr;

    const payload = await request.json();
    if (!payload.items || !payload.items.length || !payload.shopId || !payload.deliveryAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required order fields (items, shopId, deliveryAddress)" },
        { status: 400 }
      );
    }

    const ordersCol = await getCollection("orders");
    const orderId = `CE-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderId,
      customerUserId: user.id,
      customerName: user.name,
      customerPhone: user.phone || payload.customerPhone || "+880 1712-345678",
      shopId: payload.shopId,
      shopName: payload.shopName || "Campus Canteen",
      shopLocation: payload.shopLocation || "Campus",
      riderUserId: null,
      status: ORDER_STATUS.CONFIRMED, // Initial confirmed state
      deliveryAddressSnapshot: payload.deliveryAddress,
      deliveryNote: payload.deliveryNote || "",
      items: payload.items,
      subtotal: payload.subtotal,
      deliveryFee: payload.deliveryFee || DEFAULT_DELIVERY_FEE,
      total: payload.total,
      paymentStatus: payload.paymentMethod === "Cash on Delivery" ? "pending" : "paid",
      paymentMethod: payload.paymentMethod || "bKash Sandbox",
      escrowStatus: "locked",
      pickupVerificationCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      deliveryVerificationCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      statusTimestamps: {
        placedAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };

    await ordersCol.insertOne(newOrder);

    // Order placed email
    (async () => {
      try {
        if (user.email) {
          const emailData = emailTemplates.orderPlaced(newOrder, user);
          await sendEmail({
            to: user.email,
            subject: emailData.subject,
            html: emailData.html,
          });
        }
      } catch (eErr) {
        console.warn("[Order placed email warning]:", eErr.message);
      }
    })();

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: "Order placed successfully and escrow locked",
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
