import { requireRole } from "@/lib/authorization";
import TeacherDashboard from "../profesor/teacher-dashboard";

export default async function TeachersPage() {
  await requireRole(["teacher"]);
  return <TeacherDashboard />;
}
