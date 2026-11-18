import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher" || !user.academyId) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    const [classes] = await getDb().query<({ id: string; title: string; startsAt: string; status: string; courseName: string } & RowDataPacket)[]>(
      "SELECT c.id,c.title,c.starts_at AS startsAt,c.status,co.name AS courseName FROM classes c JOIN courses co ON co.id=c.course_id WHERE c.academy_id=? AND c.teacher_id=? AND c.status IN ('scheduled','accepted','rescheduled') AND c.starts_at>=DATE_SUB(NOW(),INTERVAL 30 DAY) ORDER BY c.starts_at LIMIT 100", [user.academyId, user.id]);
    const ids = classes.map((item) => item.id);
    let attendance: Array<{ class_id: string; id: string; name: string; response: string | null } & RowDataPacket> = [];
    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      const [rows] = await getDb().query<typeof attendance>(`SELECT cs.class_id,u.id,u.full_name AS name,a.response FROM course_students es JOIN users u ON u.id=es.student_id JOIN classes cs ON cs.course_id=es.course_id LEFT JOIN attendance a ON a.class_id=cs.id AND a.student_id=u.id WHERE cs.id IN (${placeholders}) ORDER BY u.full_name`, ids);
      attendance = rows;
    }
    return NextResponse.json({ classes: classes.map((item) => ({ ...item, startsAt: new Date(item.startsAt).toISOString(), students: attendance.filter((a) => a.class_id === item.id).map((a) => ({ id: a.id, name: a.name, response: a.response })) })) });
  } catch { return NextResponse.json({ error: "No se pudo cargar la agenda del profesor." }, { status: 503 }); }
}
