import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

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
      data: shops,
      meta: { total: shops.length },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
