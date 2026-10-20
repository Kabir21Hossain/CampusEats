import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    const category = searchParams.get("category");

    const menuCol = await getCollection("menuItems");
    let items = await menuCol.find();

    if (shopId) {
      items = items.filter((i) => i.shopId === shopId);
    }
    if (category && category !== "All") {
      items = items.filter((i) => i.category === category);
    }

    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const itemData = await request.json();
    const menuCol = await getCollection("menuItems");

    const newItem = {
      id: `item-${Date.now()}`,
      isAvailable: true,
      preparationTimeMinutes: 15,
      ...itemData,
      createdAt: new Date().toISOString(),
    };

    await menuCol.insertOne(newItem);
    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
