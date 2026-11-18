import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function GET() {
  try { await getDb().query("SELECT 1"); return NextResponse.json({ status: "ok", database: "connected" }); }
  catch { return NextResponse.json({ status: "needs-setup", database: process.env.DATABASE_URL ? "unreachable" : "not-configured" }, { status: 503 }); }
}
