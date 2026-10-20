import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ROLES } from "@/lib/constants";

export async function POST(request) {
  try {
    const body = await request.json();
    const { role, email, password, name, phone } = body;

    if (!email || !role || !name) {
      return NextResponse.json(
        { success: false, error: "Missing required registration fields" },
        { status: 400 }
      );
    }

    const usersCol = await getCollection("users");
    const existing = await usersCol.findOne({ email });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const userId = `${role}-${Date.now()}`;
    const newUser = {
      id: userId,
      name,
      email,
      phone,
      role,
      studentId: body.studentId || null,
      dormitoryAddress: body.dormitoryAddress || body.roomNumber ? `${body.hall || ""}, ${body.roomNumber || ""}` : null,
      shopId: null,
      vehicleType: body.vehicleType || null,
      avatarUrl: `https://images.unsplash.com/photo-${role === "student" ? "1534528741775-53994a69daeb" : role === "rider" ? "1500648767791-00dcc994a43e" : "1507003211169-0a1dd7228f2d"}?auto=format&fit=crop&w=200&q=80`,
      isSuspended: false,
      verificationStatus: role === ROLES.STUDENT ? "verified" : "pending",
      createdAt: new Date().toISOString(),
    };

    // If shop owner, create shop application
    if (role === ROLES.SHOP_OWNER) {
      const appsCol = await getCollection("shopApplications");
      const newApp = {
        id: `app-${Date.now()}`,
        ownerUserId: userId,
        applicantName: name,
        applicantEmail: email,
        applicantPhone: phone,
        shopName: body.shopName || `${name}'s Food Shop`,
        proposedLocation: body.location || "Campus",
        description: body.description || "",
        documents: [{ name: "Trade_License_2024.pdf", size: "1.2 MB" }],
        submittedAt: new Date().toISOString(),
        status: "pending",
      };
      await appsCol.insertOne(newApp);
    }

    await usersCol.insertOne(newUser);

    const response = NextResponse.json({
      success: true,
      data: newUser,
      message: "Account registered successfully",
    });

    // Set campus session cookie
    response.cookies.set("campuseats_role", role, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    response.cookies.set("campuseats_user_id", userId, { path: "/", maxAge: 60 * 60 * 24 * 7 });

    return response;
  } catch (err) {
    console.error("[Register Role Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
