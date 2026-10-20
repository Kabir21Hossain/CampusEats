import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const usersCol = await getCollection("users");
    let users = await usersCol.find();

    if (role && role !== "all") {
      users = users.filter((u) => u.role === role);
    }

    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { userId, reason } = await request.json();
    const usersCol = await getCollection("users");

    const user = await usersCol.findOne((u) => u.id === userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const nextSuspended = !user.isSuspended;
    const updates = {
      isSuspended: nextSuspended,
      suspensionReason: nextSuspended ? reason || "Administrative action" : null,
    };

    await usersCol.updateOne((u) => u.id === userId, updates);
    const updated = await usersCol.findOne((u) => u.id === userId);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
