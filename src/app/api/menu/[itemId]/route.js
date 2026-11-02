import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import {
  isShopOwner,
  requireRole,
  requireSession,
} from "@/lib/auth-server";
import { ROLES } from "@/lib/constants";

const EDITABLE_MENU_FIELDS = new Set([
  "name",
  "description",
  "price",
  "priceBDT",
  "category",
  "photoUrl",
  "image",
  "isAvailable",
  "preparationTimeMinutes",
  "dietary",
]);

/**
 * Function PATCH.
 * @param {*} request - Input value used by the operation.
 * @returns {Promise<*>} Resolves with the operation result.
 */
export async function PATCH(request, { params }) {
  try {
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;
    const roleError = requireRole(user, [ROLES.SHOP_OWNER, ROLES.ADMIN]);
    if (roleError) return roleError;

    const { itemId } = await params;
    const updates = await request.json();
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: "Provide menu item fields to update." },
        { status: 422 }
      );
    }

    const rejectedFields = Object.keys(updates).filter(
      (field) => !EDITABLE_MENU_FIELDS.has(field)
    );
    if (rejectedFields.length) {
      return NextResponse.json(
        { success: false, error: "Unsupported menu item fields.", fields: rejectedFields },
        { status: 422 }
      );
    }

    const menuCol = await getCollection("menuItems");
    const existing = await menuCol.findOne({ id: itemId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Menu item not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    const shop = await (await getCollection("shops")).findOne({ id: existing.shopId });
    if (!shop || !isShopOwner(shop, user)) {
      return NextResponse.json(
        { success: false, error: "Menu item not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await menuCol.updateOne(
      { id: itemId, shopId: existing.shopId },
      { $set: updates }
    );
    const updated = await menuCol.findOne({ id: itemId });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[Menu Update API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * Function DELETE.
 * @param {*} request - Input value used by the operation.
 * @returns {Promise<*>} Resolves with the operation result.
 */
export async function DELETE(request, { params }) {
  try {
    const { user, errorResponse } = await requireSession(request);
    if (errorResponse) return errorResponse;
    const roleError = requireRole(user, [ROLES.SHOP_OWNER, ROLES.ADMIN]);
    if (roleError) return roleError;

    const { itemId } = await params;
    const menuCol = await getCollection("menuItems");
    const existing = await menuCol.findOne({ id: itemId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Menu item not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    const shop = await (await getCollection("shops")).findOne({ id: existing.shopId });
    if (!shop || !isShopOwner(shop, user)) {
      return NextResponse.json(
        { success: false, error: "Menu item not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await menuCol.deleteOne({ id: itemId, shopId: existing.shopId });
    return NextResponse.json({ success: true, data: { id: itemId, deleted: true } });
  } catch (err) {
    console.error("[Menu Delete API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
