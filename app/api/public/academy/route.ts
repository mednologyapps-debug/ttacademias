import { NextResponse } from "next/server";
import { getAcademySlug } from "@/lib/tenant";
import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const slug = await getAcademySlug();
    if (!slug) return NextResponse.json({ academy: null });
    const [rows] = await getDb().query<({ name: string; slug: string; logoUrl: string | null; primaryColor: string } & RowDataPacket)[]>("SELECT name,slug,logo_url AS logoUrl,primary_color AS primaryColor FROM academies WHERE slug=? AND status='active' LIMIT 1", [slug]);
    return NextResponse.json({ academy: rows[0] || null });
  } catch {
    return NextResponse.json({ academy: null }, { status: 503 });
  }
}
