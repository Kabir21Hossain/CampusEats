import { NextResponse } from "next/server";
import { checkMongoConnection } from "@/lib/db";

/**
 * Safe health-check endpoint.
 * Reports service readiness and database connectivity
 * without exposing secrets, passwords, URIs, or stack traces.
 */
export async function GET() {
  const dbHealth = await checkMongoConnection();

  const health = {
    status: dbHealth.connected ? "ok" : "degraded",
    service: "campuseats",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      connected: dbHealth.connected,
      status: dbHealth.connected ? "ready" : "degraded",
    },
  };

  const statusCode = dbHealth.connected ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
