import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Safe health-check endpoint.
 * Reports service readiness and database connectivity
 * without exposing secrets, URIs, stack traces, or topology.
 */
export async function GET() {
  const health = {
    status: "ok",
    service: "campuseats",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: { connected: false },
  };

  try {
    const db = await getDb();
    if (db) {
      // If real MongoDB, try a ping
      if (typeof db.command === "function") {
        await db.command({ ping: 1 });
      }
      health.database.connected = true;
    }
  } catch {
    health.database.connected = false;
    health.status = "degraded";
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
