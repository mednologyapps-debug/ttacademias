import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { getAcademySlug } from "@/lib/tenant";
import type { RowDataPacket } from "mysql2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const dni = String(body.dni || "").replace(/\D/g, "");
    const academySlug = await getAcademySlug() || String(body.academySlug || "").trim().toLowerCase();
    if (fullName.length < 3 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || !/^\d{8}$/.test(dni) || !academySlug) return NextResponse.json({ error: "Completa nombre, correo, contraseña de 10 caracteres, DNI y academia." }, { status: 400 });
    const db = getDb();
    const [academies] = await db.query<({ id: string; status: string } & RowDataPacket)[]>("SELECT id,status FROM academies WHERE slug=? LIMIT 1", [academySlug]);
    if (!academies[0] || academies[0].status !== "active") return NextResponse.json({ error: "No encontramos una academia activa con ese subdominio." }, { status: 404 });
    const id = randomUUID();
    await db.execute("INSERT INTO users (id,academy_id,email,password_hash,full_name,dni,phone,role) VALUES (?,?,?,?,?,?,?,'student')", [id, academies[0].id, email, await bcrypt.hash(password, 12), fullName, dni, String(body.phone || "").trim() || null]);
    await createSession(id);
    return NextResponse.json({ ok: true, redirect: "/alumno" }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Ya existe una cuenta con ese correo o DNI en esta academia." }, { status: 409 });
    if ((error as Error).message === "DATABASE_NOT_CONFIGURED") return NextResponse.json({ error: "La base de datos aún no está configurada. Revisa la guía de puesta en marcha." }, { status: 503 });
    return NextResponse.json({ error: "No se pudo completar el registro." }, { status: 500 });
  }
}
