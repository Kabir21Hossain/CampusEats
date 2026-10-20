import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ROLES } from "@/lib/constants";

export async function GET(request) {
  try {
    const roleCookie = request.cookies.get("campuseats_role")?.value;
    const userIdCookie = request.cookies.get("campuseats_user_id")?.value;

    const usersCol = await getCollection("users");
    let user = null;

    if (userIdCookie) {
      user = await usersCol.findOne({ id: userIdCookie });
    } else if (roleCookie) {
      user = await usersCol.findOne({ role: roleCookie });
    }

    if (!user) {
      // Default fallback demo user
      user = await usersCol.findOne({ role: ROLES.STUDENT });
    }

    return NextResponse.json({
      authenticated: !!user,
      user: user || null,
      role: user?.role || "visitor",
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null, role: "visitor" });
  }
}
