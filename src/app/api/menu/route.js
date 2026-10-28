import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import {
  isShopOwner,
  requireRole,
  requireSession,
} from "@/lib/auth-server";
import { ROLES } from "@/lib/constants";

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
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;
    const roleError = requireRole(user, [ROLES.SHOP_OWNER, ROLES.ADMIN]);
    if (roleError) return roleError;

    const itemData = await request.json();
    if (typeof itemData?.shopId !== "string" || !itemData.shopId.trim()) {
      return NextResponse.json(
        { success: false, error: "shopId is required." },
        { status: 422 }
      );
    }

    const shopsCol = await getCollection("shops");
    const shop = await shopsCol.findOne({ id: itemData.shopId });
    if (!shop || !isShopOwner(shop, user)) {
      return NextResponse.json(
        { success: false, error: "Shop not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const menuCol = await getCollection("menuItems");

    const newItem = {
      isAvailable: true,
      preparationTimeMinutes: 15,
      ...itemData,
      id: `item-${Date.now()}`,
      shopId: shop.id,
      createdAt: new Date().toISOString(),
    };

    await menuCol.insertOne(newItem);
    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (err) {
    console.error("[Menu API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
