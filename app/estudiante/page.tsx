import StudentPortal from "../student-portal";
import { requireRole } from "@/lib/authorization";

export default async function StudentPage() {
  await requireRole(["student"]);
  return <StudentPortal />;
}
