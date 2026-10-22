import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";

export async function GET(request) {
  try {
    const sessionData = await getServerSession(request);

    if (!sessionData || !sessionData.user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        role: "visitor",
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: sessionData.user,
      session: sessionData.session,
      role: sessionData.user.role || "student",
    });
  } catch (err) {
    return NextResponse.json(
      { authenticated: false, user: null, role: "visitor" },
      { status: 200 }
    );
  }
}
