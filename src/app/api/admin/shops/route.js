import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function GET(request) {
  try {
    const appsCol = await getCollection("shopApplications");
    const apps = await appsCol.find();
    return NextResponse.json({ success: true, data: apps });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
