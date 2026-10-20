import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { shopId } = await params;
    const shopsCol = await getCollection("shops");
    const shop = await shopsCol.findOne((s) => s.id === shopId || s.slug === shopId);

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: shop });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { shopId } = await params;
    const updates = await request.json();
    const shopsCol = await getCollection("shops");

    const shop = await shopsCol.findOne((s) => s.id === shopId);
    if (!shop) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    // Support toggle open status or full updates
    let updatedPayload = updates;
    if (updates.toggleStatus) {
      updatedPayload = { isOpen: !shop.isOpen };
    }

    await shopsCol.updateOne((s) => s.id === shopId, updatedPayload);
    const updatedShop = await shopsCol.findOne((s) => s.id === shopId);

    return NextResponse.json({ success: true, data: updatedShop });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
