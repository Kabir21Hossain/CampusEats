import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/constants";
import { requireAdminSession } from "@/lib/auth-server";

/**
 * Function GET.
 * @param {*} request - Input value used by the operation.
 * @returns {Promise<*>} Resolves with the operation result.
 */
export async function GET(request) {
  try {
    const { errorResponse } = await requireAdminSession(request);
    if (errorResponse) return errorResponse;

    const ordersCol = await getCollection("orders");
    const shopsCol = await getCollection("shops");
    const usersCol = await getCollection("user");
    const appsCol = await getCollection("shopApplications");
    const disputesCol = await getCollection("disputes");

    const orders = await ordersCol.find();
    const shops = await shopsCol.find();
    const users = await usersCol.find();
    const apps = await appsCol.find();
    const disputes = await disputesCol.find();

    const totalGMV = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const deliveredCount = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length;
    const pendingApps = apps.filter((a) => a.status === "pending").length;
    const activeDisputes = disputes.filter((d) => d.status === "pending").length;

    return NextResponse.json({
      success: true,
      data: {
        totalGMV,
        totalOrders: orders.length,
        deliveredOrders: deliveredCount,
        activeShops: shops.filter((s) => s.approvalStatus === "approved").length,
        pendingApplications: pendingApps,
        activeDisputes,
        totalUsers: users.length,
      },
    });
  } catch (err) {
    console.error("[Admin KPI API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
