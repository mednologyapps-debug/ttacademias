import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "global_admin") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params; const body = await request.json();
  const status = body.status; const color = body.primaryColor; const logo = body.logoUrl;
  if (status !== undefined && !["active","suspended","pending"].includes(status)) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  if (color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(String(color))) return NextResponse.json({ error: "Color inválido." }, { status: 400 });
  if (logo !== undefined && logo !== null && (!String(logo).startsWith("https://") || String(logo).length > 500)) return NextResponse.json({ error: "El logo debe tener una URL https válida." }, { status: 400 });
  const [result] = await getDb().execute("UPDATE academies SET status=COALESCE(?,status),primary_color=COALESCE(?,primary_color),logo_url=COALESCE(?,logo_url) WHERE id=?", [status ?? null,color ?? null,logo ?? null,id]);
  if (!(result as { affectedRows: number }).affectedRows) return NextResponse.json({ error: "Academia no encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
