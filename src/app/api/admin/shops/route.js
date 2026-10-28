import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth-server";

export async function GET(request) {
  try {
    const { errorResponse } = await requireAdminSession(request);
    if (errorResponse) return errorResponse;

    const appsCol = await getCollection("shopApplications");
    const apps = await appsCol.find();
    return NextResponse.json({ success: true, data: apps });
  } catch (err) {
    console.error("[Admin Shops API Error]:", err.name || "Error");
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
