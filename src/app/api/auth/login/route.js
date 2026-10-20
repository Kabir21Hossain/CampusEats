import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ROLES } from "@/lib/constants";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Please enter your campus email" },
        { status: 400 }
      );
    }

    const usersCol = await getCollection("users");
    let user = await usersCol.findOne({ email });

    // If not found by exact email, allow demo login convenience
    if (!user) {
      if (email.includes("owner") || email.includes("grill")) {
        user = await usersCol.findOne({ role: ROLES.SHOP_OWNER });
      } else if (email.includes("rider")) {
        user = await usersCol.findOne({ role: ROLES.RIDER });
      } else if (email.includes("admin")) {
        user = await usersCol.findOne({ role: ROLES.ADMIN });
      } else {
        user = await usersCol.findOne({ role: ROLES.STUDENT });
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials or account not found" },
        { status: 401 }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        {
          success: false,
          error: "This account has been suspended by campus administration.",
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: user,
      role: user.role,
    });

    response.cookies.set("campuseats_role", user.role, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false,
    });
    response.cookies.set("campuseats_user_id", user.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false,
    });

    return response;
  } catch (err) {
    console.error("[Login Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
