import {offers} from "@/lib/enrollment";
import { redirect } from "next/navigation";
import AcademyLanding from "./academy-landing";
import { getCurrentUser } from "@/lib/auth";
import { getAcademySlug } from "@/lib/tenant";
import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export default async function PortalHome() {
  try {
    const user = await getCurrentUser();
    if (user) redirect(user.role === "student" ? "/alumno" : user.role === "teacher" ? "/profesores" : user.role === "academy_admin" ? "/admin" : "/global-admin");
  } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error; }
  let academy: { id: string; name: string; slug: string; logoUrl: string | null; primaryColor: string } | null = null;
  let canEnroll=false;
  let teachers: string[] = [];
  try {
    const slug = await getAcademySlug();
    if (slug) {
      const db = getDb();
      const [rows] = await db.query<({ id: string; name: string; slug: string; logoUrl: string | null; primaryColor: string } & RowDataPacket)[]>("SELECT id,name,slug,logo_url AS logoUrl,primary_color AS primaryColor FROM academies WHERE slug=? AND status='active' LIMIT 1", [slug]);
      academy = rows[0] || null;
      if (academy) {
        const [staff] = await db.query<({ fullName: string } & RowDataPacket)[]>("SELECT full_name AS fullName FROM users WHERE academy_id=? AND role='teacher' AND status='active' ORDER BY full_name LIMIT 3", [academy.id]);
        canEnroll=(await offers(academy.id,true)).length>0;
        teachers = staff.map((row) => row.fullName);
      }
    }
  } catch { /* Local preview can run before database configuration. */ }
  if (!academy && process.env.NODE_ENV !== "production") academy = { id: "preview", name: "Lawntennis Club", slug: "lawntennis", logoUrl: null, primaryColor: "#0b50c8" };
  return <AcademyLanding academyName={academy?.name || "TT Academias"} logoUrl={academy?.logoUrl || null} primaryColor={academy?.primaryColor || "#0b50c8"} canEnroll={canEnroll || (!process.env.DATABASE_URL && process.env.NODE_ENV==="development")} teachers={teachers}/>;
}
