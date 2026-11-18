import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.academyId) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const [rows] = await getDb().query<({ name: string; logoUrl: string | null; primaryColor: string } & RowDataPacket)[]>("SELECT name,logo_url AS logoUrl,primary_color AS primaryColor FROM academies WHERE id=? LIMIT 1", [user.academyId]);
  return NextResponse.json({ academy: rows[0] });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "academy_admin" || !user.academyId) return NextResponse.json({ error: "Solo el administrador de academia puede cambiar su marca." }, { status: 403 });
  const body = await request.json(); const name = String(body.name || "").trim(); const color = String(body.primaryColor || ""); const logo = String(body.logoUrl || "").trim() || null;
  if (name.length < 3 || !/^#[0-9a-fA-F]{6}$/.test(color) || (logo && (!logo.startsWith("https://") || logo.length > 500))) return NextResponse.json({ error: "Revisa el nombre, el color y la URL https del logo." }, { status: 400 });
  await getDb().execute("UPDATE academies SET name=?,primary_color=?,logo_url=? WHERE id=?", [name,color,logo,user.academyId]);
  return NextResponse.json({ ok: true });
}
