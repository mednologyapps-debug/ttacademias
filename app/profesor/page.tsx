import { requireRole } from "@/lib/authorization";
import TeacherDashboard from "./teacher-dashboard";

export default async function TeacherPage() {
  await requireRole(["teacher"]);
  return <TeacherDashboard />;
}
