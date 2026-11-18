import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

const COOKIE = "ttacademy_session";
const DAY = 24 * 60 * 60 * 1000;
export type AuthUser = { id: string; name: string; email: string; role: string; academyId: string | null; academyName: string | null; academySlug: string | null };
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function createSession(userId: string, remember = true) {
  const raw = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + (remember ? 30 : 1) * DAY);
  await getDb().execute("INSERT INTO sessions (id,user_id,expires_at) VALUES (?,?,?)", [digest(raw), userId, expires]);
  (await cookies()).set(COOKIE, raw, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [rows] = await getDb().query<(AuthUser & { expiresAt: Date } & RowDataPacket)[]>(
    "SELECT u.id,u.full_name AS name,u.email,u.role,u.academy_id AS academyId,a.name AS academyName,a.slug AS academySlug,s.expires_at AS expiresAt FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN academies a ON a.id=u.academy_id WHERE s.id=? AND s.expires_at>NOW() AND u.status='active' AND (u.role='global_admin' OR a.status='active') LIMIT 1", [digest(raw)]);
  return rows[0] || null;
}

export async function destroySession() {
  const jar = await cookies(); const raw = jar.get(COOKIE)?.value;
  if (raw) await getDb().execute("DELETE FROM sessions WHERE id=?", [digest(raw)]);
  jar.delete(COOKIE);
}
