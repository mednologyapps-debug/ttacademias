import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "global_admin") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const [rows] = await getDb().query<({ id: string; name: string; slug: string; logoUrl: string | null; primaryColor: string; status: string; students: number; staff: number } & RowDataPacket)[]>("SELECT a.id,a.name,a.slug,a.logo_url AS logoUrl,a.primary_color AS primaryColor,a.status,COUNT(CASE WHEN u.role='student' THEN 1 END) AS students,COUNT(CASE WHEN u.role IN ('teacher','academy_admin') THEN 1 END) AS staff FROM academies a LEFT JOIN users u ON u.academy_id=a.id GROUP BY a.id ORDER BY a.created_at DESC");
  return NextResponse.json({ academies: rows });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "global_admin") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const body = await request.json(); const name = String(body.name || "").trim(); const slug = String(body.slug || "").trim().toLowerCase();
  const color = String(body.primaryColor || "#1554D1"); const logo = String(body.logoUrl || "").trim() || null;
  const adminName = String(body.adminName || "").trim(); const adminEmail = String(body.adminEmail || "").trim().toLowerCase(); const adminPassword = String(body.adminPassword || "");
  if (name.length < 3 || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) return NextResponse.json({ error: "Ingresa nombre y subdominio válido (letras, números y guiones)." }, { status: 400 });
  if (adminName.length < 3 || !/^\S+@\S+\.\S+$/.test(adminEmail) || adminPassword.length < 12) return NextResponse.json({ error: "Completa un administrador inicial y una contraseña de al menos 12 caracteres." }, { status: 400 });
  if (!/^#[0-9a-fA-F]{6}$/.test(color) || (logo && (!logo.startsWith("https://") || logo.length > 500))) return NextResponse.json({ error: "Revisa el color y la URL https del logo." }, { status: 400 });
  try {
    const id = randomUUID(); const adminId = randomUUID(); const db = getDb(); const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute("INSERT INTO academies (id,name,slug,logo_url,primary_color) VALUES (?,?,?,?,?)", [id,name,slug,logo,color]);
      await connection.execute("INSERT INTO users (id,academy_id,email,password_hash,full_name,role) VALUES (?,?,?,?,?,'academy_admin')", [adminId,id,adminEmail,await bcrypt.hash(adminPassword,12),adminName]);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
    return NextResponse.json({ academy: { id,name,slug,logoUrl:logo,primaryColor:color,status:"active",students:0,staff:0 } }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: (error as { code?: string }).code === "ER_DUP_ENTRY" ? "Ese subdominio ya está en uso." : "No se pudo crear la academia." }, { status: 400 }); }
}
