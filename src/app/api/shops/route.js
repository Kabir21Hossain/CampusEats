import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

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
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q") || searchParams.get("query");

    const shopsCol = await getCollection("shops");
    let shops = await shopsCol.find({ approvalStatus: "approved" });

    if (category && category !== "All") {
      shops = shops.filter(
        (s) => s.cuisine.toLowerCase() === category.toLowerCase()
      );
    }

    if (query) {
      const q = query.toLowerCase();
      shops = shops.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.campusLocation.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      data: shops.map(publicShop),
      meta: { total: shops.length },
    });
  } catch (err) {
    console.error("[Shops API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
