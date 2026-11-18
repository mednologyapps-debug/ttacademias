import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params; const body = await request.json(); const action = String(body.action || "");
  if (process.env.NODE_ENV !== "production" && user.id === "local-demo-teacher" && ["demo-class-1", "demo-class-2"].includes(id)) {
    if (action === "attendance") {
      const start = new Date(); start.setDate(start.getDate() + (id === "demo-class-2" ? 2 : 0)); start.setHours(id === "demo-class-2" ? 19 : 18, 0, 0, 0);
      if (Date.now() < start.getTime()) return NextResponse.json({ error: `La asistencia estará disponible desde las ${start.toLocaleTimeString("es-PE", { hour:"numeric", minute:"2-digit" })}.` }, { status: 409 });
    }
    return NextResponse.json({ ok: true, status: action === "accept" ? "accepted" : "rescheduled", startsAt: action === "reschedule" ? body.startsAt : undefined, response: action === "attendance" ? body.response : undefined });
  }
  if (!user.academyId) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  if (action === "attendance") {
    if (!body.studentId || !["yes", "no", "present", "absent"].includes(body.response)) return NextResponse.json({ error: "Asistencia inválida." }, { status: 400 });
    const [scheduled] = await getDb().query<{ startsAt: Date }[] & import("mysql2").RowDataPacket[]>("SELECT starts_at AS startsAt FROM classes WHERE id=? AND academy_id=? AND teacher_id=? LIMIT 1", [id, user.academyId, user.id]);
    if (!scheduled.length) return NextResponse.json({ error: "Clase no encontrada o no asignada a este profesor." }, { status: 404 });
    if (new Date(scheduled[0].startsAt).getTime() > Date.now()) return NextResponse.json({ error: "La asistencia solo puede tomarse desde la hora de inicio de la clase." }, { status: 409 });
    const [result] = await getDb().execute("INSERT INTO attendance (class_id,student_id,response) SELECT c.id,?,? FROM classes c JOIN course_students cs ON cs.course_id=c.course_id AND cs.student_id=? WHERE c.id=? AND c.academy_id=? AND c.teacher_id=? ON DUPLICATE KEY UPDATE response=VALUES(response)", [body.studentId, body.response, body.studentId, id, user.academyId, user.id]);
    if (!(result as { affectedRows: number }).affectedRows) return NextResponse.json({ error: "Clase o alumno no válido para este profesor." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  if (!["accept", "reschedule"].includes(action)) return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  if (action === "reschedule" && !body.startsAt) return NextResponse.json({ error: "Indica la nueva fecha y hora." }, { status: 400 });
  if (action === "reschedule") {
    const parsed = new Date(body.startsAt);
    if (!Number.isFinite(parsed.getTime()) || parsed.getTime() <= Date.now()) return NextResponse.json({ error: "Elige una fecha y hora futura." }, { status: 400 });
    const [conflicts] = await getDb().query<{ id: string }[] & import("mysql2").RowDataPacket[]>("SELECT id FROM classes WHERE academy_id=? AND teacher_id=? AND id<>? AND status<>'cancelled' AND starts_at>DATE_SUB(?,INTERVAL 120 MINUTE) AND starts_at<DATE_ADD(?,INTERVAL 120 MINUTE) LIMIT 1", [user.academyId, user.id, id, parsed, parsed]);
    if (conflicts.length) return NextResponse.json({ error: "Ese horario se cruza con otra clase. Elige otro espacio." }, { status: 409 });
  }
  const status = action === "accept" ? "accepted" : "rescheduled";
  const [result] = await getDb().execute("UPDATE classes SET status=?,starts_at=COALESCE(?,starts_at) WHERE id=? AND academy_id=? AND teacher_id=? AND status<>'cancelled'", [status, action === "reschedule" ? body.startsAt : null, id, user.academyId, user.id]);
  if (!(result as { affectedRows: number }).affectedRows) return NextResponse.json({ error: "Clase no encontrada o no asignada a este profesor." }, { status: 404 });
  return NextResponse.json({ ok: true, status });
}
