import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function PATCH(request, { params }) {
  try {
    const { itemId } = await params;
    const updates = await request.json();
    const menuCol = await getCollection("menuItems");

    await menuCol.updateOne((i) => i.id === itemId, updates);
    const updated = await menuCol.findOne((i) => i.id === itemId);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { itemId } = await params;
    const menuCol = await getCollection("menuItems");

    await menuCol.deleteOne((i) => i.id === itemId);
    return NextResponse.json({ success: true, data: { id: itemId, deleted: true } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
