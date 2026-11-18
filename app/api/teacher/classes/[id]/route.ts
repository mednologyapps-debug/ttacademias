import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher" || !user.academyId) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params; const body = await request.json(); const action = String(body.action || "");
  if (action === "attendance") {
    if (!body.studentId || !["yes", "no", "present", "absent"].includes(body.response)) return NextResponse.json({ error: "Asistencia inválida." }, { status: 400 });
    const [result] = await getDb().execute("INSERT INTO attendance (class_id,student_id,response) SELECT c.id,?,? FROM classes c JOIN course_students cs ON cs.course_id=c.course_id AND cs.student_id=? WHERE c.id=? AND c.academy_id=? AND c.teacher_id=? ON DUPLICATE KEY UPDATE response=VALUES(response)", [body.studentId, body.response, body.studentId, id, user.academyId, user.id]);
    if (!(result as { affectedRows: number }).affectedRows) return NextResponse.json({ error: "Clase o alumno no válido para este profesor." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  if (!["accept", "reschedule"].includes(action)) return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  if (action === "reschedule" && !body.startsAt) return NextResponse.json({ error: "Indica la nueva fecha y hora." }, { status: 400 });
  const status = action === "accept" ? "accepted" : "rescheduled";
  const [result] = await getDb().execute("UPDATE classes SET status=?,starts_at=COALESCE(?,starts_at) WHERE id=? AND academy_id=? AND teacher_id=? AND status<>'cancelled'", [status, action === "reschedule" ? body.startsAt : null, id, user.academyId, user.id]);
  if (!(result as { affectedRows: number }).affectedRows) return NextResponse.json({ error: "Clase no encontrada o no asignada a este profesor." }, { status: 404 });
  return NextResponse.json({ ok: true, status });
}
