import { requireRole } from "@/lib/authorization";
import StudentPortal from "../student-portal";

export default async function StudentHomePage() {
  await requireRole(["student"]);
  return <StudentPortal />;
}
