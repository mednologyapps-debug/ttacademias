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
  let ranking: { id: string; title: string; startsAt: string; venue: string; studentPrice: string; publicPrice: string; capacity: number } | null = null;
  let teachers: string[] = [];
  try {
    const slug = await getAcademySlug();
    if (slug) {
      const db = getDb();
      const [rows] = await db.query<({ id: string; name: string; slug: string; logoUrl: string | null; primaryColor: string } & RowDataPacket)[]>("SELECT id,name,slug,logo_url AS logoUrl,primary_color AS primaryColor FROM academies WHERE slug=? AND status='active' LIMIT 1", [slug]);
      academy = rows[0] || null;
      if (academy) {
        const [upcoming] = await db.query<({ id: string; title: string; startsAt: string; venue: string; studentPrice: string; publicPrice: string; capacity: number } & RowDataPacket)[]>("SELECT id,title,starts_at AS startsAt,venue,student_price AS studentPrice,public_price AS publicPrice,capacity FROM rankings WHERE academy_id=? AND status='published' AND starts_at>=NOW() AND NOT EXISTS (SELECT 1 FROM academy_operations op WHERE op.academy_id=rankings.academy_id AND op.record_key=CONCAT('event:',rankings.id)) ORDER BY starts_at LIMIT 1", [academy.id]);
        ranking = upcoming[0] || null;
        const [staff] = await db.query<({ fullName: string } & RowDataPacket)[]>("SELECT full_name AS fullName FROM users WHERE academy_id=? AND role='teacher' AND status='active' ORDER BY full_name LIMIT 3", [academy.id]);
        teachers = staff.map((row) => row.fullName);
      }
    }
  } catch { /* Local preview can run before database configuration. */ }
  if (!academy && process.env.NODE_ENV !== "production") academy = { id: "preview", name: "Lawntennis Club", slug: "lawntennis", logoUrl: null, primaryColor: "#0b50c8" };
  if (!ranking && academy?.id === "preview") ranking = { id: "demo-ranking", title: "Ranking Relámpago de la Academia", startsAt: "2026-11-28T16:00:00-05:00", venue: "Sede Miraflores · Lima", studentPrice: "25.00", publicPrice: "40.00", capacity: 20 };
  return <AcademyLanding academyName={academy?.name || "TT Academias"} logoUrl={academy?.logoUrl || null} primaryColor={academy?.primaryColor || "#0b50c8"} ranking={ranking} teachers={teachers}/>;
}
