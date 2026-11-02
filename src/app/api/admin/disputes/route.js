import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
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

    const disputesCol = await getCollection("disputes");
    const disputes = await disputesCol.find();
    return NextResponse.json({ success: true, data: disputes });
  } catch (err) {
    console.error("[Admin Disputes API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * Function POST.
 * @param {*} request - Input value used by the operation.
 * @returns {Promise<*>} Resolves with the operation result.
 */
export async function POST(request) {
  try {
    const { errorResponse } = await requireAdminSession(request);
    if (errorResponse) return errorResponse;

    const { disputeId, resolution, refundAmount } = await request.json();
    const disputesCol = await getCollection("disputes");

    const dispute = await disputesCol.findOne({ id: disputeId });
    if (!dispute) {
      return NextResponse.json({ success: false, error: "Dispute not found" }, { status: 404 });
    }

    const updates = {
      status: "resolved",
      resolution,
      refundAmount: refundAmount || 0,
      resolvedAt: new Date().toISOString(),
    };

    await disputesCol.updateOne({ id: disputeId }, { $set: updates });
    const updated = await disputesCol.findOne({ id: disputeId });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[Admin Disputes API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
