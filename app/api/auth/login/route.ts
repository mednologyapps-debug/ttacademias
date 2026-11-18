import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { getAcademySlug } from "@/lib/tenant";
import type { RowDataPacket } from "mysql2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); const email = String(body.email || "").trim().toLowerCase(); const password = String(body.password || "");
    const academySlug = await getAcademySlug(); const db = getDb();
    const [rows] = await db.query<({ id: string; password_hash: string | null; status: string } & RowDataPacket)[]>(
      academySlug ? "SELECT u.id,u.password_hash,u.status FROM users u JOIN academies a ON a.id=u.academy_id WHERE u.email=? AND a.slug=? LIMIT 1" : "SELECT id,password_hash,status FROM users WHERE email=? AND role='global_admin' LIMIT 1", academySlug ? [email, academySlug] : [email]);
    const user = rows[0];
    if (!user || user.status !== "active" || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
    await createSession(user.id, Boolean(body.remember)); return NextResponse.json({ ok: true, redirect: "/" });
  } catch (error) {
    const status = (error as Error).message === "DATABASE_NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ error: status === 503 ? "La base de datos aún no está configurada." : "No se pudo iniciar sesión." }, { status });
  }
}
