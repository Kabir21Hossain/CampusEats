import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import {
  isShopOwner,
  requireRole,
  requireSession,
} from "@/lib/auth-server";
import { ROLES } from "@/lib/constants";

const EDITABLE_SHOP_FIELDS = new Set([
  "name",
  "campusZone",
  "location",
  "description",
  "cuisine",
  "isOpen",
  "logo",
  "banner",
  "bkashNumber",
]);

/**
 * Function publicShop.
 * @param {*} shop - Input value used by the operation.
 * @returns {*} The operation result.
 */
function publicShop(shop) {
  const { bkashNumber, paymentDetails, ...safeShop } = shop;
  return safeShop;
}

/**
 * Function GET.
 * @param {*} request - Input value used by the operation.
 * @returns {Promise<*>} Resolves with the operation result.
 */
export async function GET(request, { params }) {
  try {
    const { shopId } = await params;
    const shopsCol = await getCollection("shops");
    const shop = await shopsCol.findOne({
      $or: [{ id: shopId }, { slug: shopId }],
    });

    if (!shop || shop.approvalStatus !== "approved") {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: publicShop(shop) });
  } catch (err) {
    console.error("[Shop Detail API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

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

    const { shopId } = await params;
    const updates = await request.json();
    const shopsCol = await getCollection("shops");

    const shop = await shopsCol.findOne({ id: shopId });
    if (!shop) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }
    if (!isShopOwner(shop, user)) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: "Provide shop fields to update." },
        { status: 422 }
      );
    }
    const fields = Object.keys(updates);
    const rejectedFields = fields.filter(
      (field) => field !== "toggleStatus" && !EDITABLE_SHOP_FIELDS.has(field)
    );
    if (rejectedFields.length || !fields.length) {
      return NextResponse.json(
        { success: false, error: "Unsupported shop fields.", fields: rejectedFields },
        { status: 422 }
      );
    }

    const updatedPayload = { ...updates };
    if (Object.hasOwn(updatedPayload, "toggleStatus")) {
      if (updatedPayload.toggleStatus !== true || fields.length !== 1) {
        return NextResponse.json(
          { success: false, error: "toggleStatus must be the only update and must be true." },
          { status: 422 }
        );
      }
      delete updatedPayload.toggleStatus;
      updatedPayload.isOpen = !shop.isOpen;
    }

    await shopsCol.updateOne(
      { id: shopId },
      { $set: { ...updatedPayload, updatedAt: new Date().toISOString() } }
    );
    const updatedShop = await shopsCol.findOne({ id: shopId });

    return NextResponse.json({ success: true, data: publicShop(updatedShop) });
  } catch (err) {
    console.error("[Shop Update API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
