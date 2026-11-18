import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    if (process.env.NODE_ENV !== "production" && user.id === "local-demo-teacher") {
      const today = new Date();
      const at = (days: number, hour: number) => { const date = new Date(today); date.setDate(date.getDate() + days); date.setHours(hour, 0, 0, 0); return date.toISOString(); };
      const sample = [
        { id: "demo-class-1", title: "Control de saques & Topspin", courseName: "Intermedio · Fundamentos de juego", startsAt: at(0, 18), status: "scheduled", students: [{ id: "demo-student-1", name: "Mateo Gonzales", response: "yes" }, { id: "demo-student-2", name: "Vanessa Cárdenas", response: null }, { id: "demo-student-3", name: "Diego Vásquez", response: "no" }] },
        { id: "demo-class-2", title: "Táctica de partido & transiciones", courseName: "Avanzado · Temporada de verano", startsAt: at(2, 19), status: "accepted", students: [{ id: "demo-student-4", name: "Nicole Torres", response: null }, { id: "demo-student-5", name: "Mateo Gonzales", response: null }] },
        { id: "demo-class-history", title: "Juego corto y recepción", courseName: "Básico · Fundamentos de juego", startsAt: at(-2, 18), status: "completed", students: [{ id: "demo-student-1", name: "Mateo Gonzales", response: "present" }, { id: "demo-student-2", name: "Vanessa Cárdenas", response: "absent" }] },
      ];
      return NextResponse.json({ classes: sample.filter((item) => item.status !== "completed"), history: sample.filter((item) => item.status === "completed") });
    }
    if (!user.academyId) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    const [classes] = await getDb().query<({ id: string; title: string; startsAt: string; status: string; courseName: string } & RowDataPacket)[]>(
      "SELECT c.id,c.title,c.starts_at AS startsAt,c.status,co.name AS courseName FROM classes c JOIN courses co ON co.id=c.course_id WHERE c.academy_id=? AND c.teacher_id=? AND c.status<>'cancelled' AND c.starts_at>=DATE_SUB(NOW(),INTERVAL 365 DAY) ORDER BY c.starts_at LIMIT 300", [user.academyId, user.id]);
    const ids = classes.map((item) => item.id);
    let attendance: Array<{ class_id: string; id: string; name: string; response: string | null } & RowDataPacket> = [];
    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      const [rows] = await getDb().query<typeof attendance>(`SELECT cs.class_id,u.id,u.full_name AS name,a.response FROM course_students es JOIN users u ON u.id=es.student_id JOIN classes cs ON cs.course_id=es.course_id LEFT JOIN attendance a ON a.class_id=cs.id AND a.student_id=u.id WHERE cs.id IN (${placeholders}) ORDER BY u.full_name`, ids);
      attendance = rows;
    }
    const hydrated = classes.map((item) => ({ ...item, startsAt: new Date(item.startsAt).toISOString(), students: attendance.filter((a) => a.class_id === item.id).map((a) => ({ id: a.id, name: a.name, response: a.response })) }));
    const now = Date.now();
    const isFinished = (item: typeof hydrated[number]) => new Date(item.startsAt).getTime() + 120 * 60 * 1000 < now;
    return NextResponse.json({ classes: hydrated.filter((item) => item.status !== "completed" && !isFinished(item)), history: hydrated.filter((item) => item.status === "completed" || isFinished(item)) });
  } catch { return NextResponse.json({ error: "No se pudo cargar la agenda del profesor." }, { status: 503 }); }
}
