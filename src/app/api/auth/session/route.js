import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";

/**
 * Function GET.
 * @param {*} request - Input value used by the operation.
 * @returns {Promise<*>} Resolves with the operation result.
 */
export async function GET(request) {
  const headers = request.headers;
  try {
    const sessionData = await getServerSession({ headers });

    if (sessionData?.inactive) {
      return NextResponse.json(
        { authenticated: false, user: null, role: "visitor", code: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }

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
    console.error("[Auth Session Route Error]:", err.name || "Error");
    return NextResponse.json(
      { authenticated: false, user: null, role: "visitor", code: "AUTHENTICATION_UNAVAILABLE" },
      { status: 500 }
    );
  }
}
