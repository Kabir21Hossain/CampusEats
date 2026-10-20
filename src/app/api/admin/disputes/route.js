import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function GET() {
  try {
    const disputesCol = await getCollection("disputes");
    const disputes = await disputesCol.find();
    return NextResponse.json({ success: true, data: disputes });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { disputeId, resolution, refundAmount } = await request.json();
    const disputesCol = await getCollection("disputes");

    const dispute = await disputesCol.findOne((d) => d.id === disputeId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: "Dispute not found" }, { status: 404 });
    }

    const updates = {
      status: "resolved",
      resolution,
      refundAmount: refundAmount || 0,
      resolvedAt: new Date().toISOString(),
    };

    await disputesCol.updateOne((d) => d.id === disputeId, updates);
    const updated = await disputesCol.findOne((d) => d.id === disputeId);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
