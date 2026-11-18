import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { getAcademySlug } from "@/lib/tenant";
import { sendMail } from "@/lib/mail";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const generic = () => NextResponse.json({ ok: true, message: "Si la cuenta existe, recibirás un correo con instrucciones." });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); const db = getDb();
    if (body.token) {
      const token = String(body.token); const password = String(body.password || "");
      if (password.length < 10) return NextResponse.json({ error: "La contraseña debe tener al menos 10 caracteres." }, { status: 400 });
      const [tokens] = await db.query<({ user_id: string } & RowDataPacket)[]>("SELECT user_id FROM password_reset_tokens WHERE token_hash=? AND expires_at>NOW() AND used_at IS NULL LIMIT 1", [hash(token)]);
      if (!tokens[0]) return NextResponse.json({ error: "El enlace venció o ya fue utilizado. Solicita uno nuevo." }, { status: 400 });
      const connection = await db.getConnection();
      try { await connection.beginTransaction(); await connection.execute("UPDATE users SET password_hash=? WHERE id=?", [await bcrypt.hash(password, 12), tokens[0].user_id]); await connection.execute("UPDATE password_reset_tokens SET used_at=NOW() WHERE token_hash=?", [hash(token)]); await connection.execute("DELETE FROM sessions WHERE user_id=?", [tokens[0].user_id]); await connection.commit(); }
      catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
      return NextResponse.json({ ok: true, message: "Contraseña actualizada. Ya puedes iniciar sesión." });
    }
    const email = String(body.email || "").trim().toLowerCase(); const academy = await getAcademySlug();
    if (!academy || !email) return generic();
    const [users] = await db.query<({ id: string; full_name: string } & RowDataPacket)[]>("SELECT u.id,u.full_name FROM users u JOIN academies a ON a.id=u.academy_id WHERE u.email=? AND a.slug=? AND u.status='active' LIMIT 1", [email, academy]);
    if (!users[0]) return generic();
    const token = randomBytes(32).toString("base64url");
    await db.execute("INSERT INTO password_reset_tokens (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 30 MINUTE))", [hash(token), users[0].id]);
    const url = `${process.env.APP_URL || "http://localhost:3000"}/recuperar-clave?token=${encodeURIComponent(token)}`;
    await sendMail(email, "Restablece tu contraseña", `<p>Hola ${users[0].full_name},</p><p>Usa este enlace para crear una contraseña nueva. Vence en 30 minutos.</p><p><a href="${url}">Restablecer contraseña</a></p><p>Si no solicitaste este cambio, ignora este correo.</p>`);
    return generic();
  } catch (error) {
    if ((error as Error).message === "DATABASE_NOT_CONFIGURED") return NextResponse.json({ error: "La base de datos aún no está configurada." }, { status: 503 });
    if ((error as Error).message === "SMTP_NOT_CONFIGURED") return NextResponse.json({ error: "El correo saliente aún no está configurado." }, { status: 503 });
    return NextResponse.json({ error: "No se pudo procesar la solicitud." }, { status: 500 });
  }
}
