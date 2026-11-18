import StudentPortal from "./student-portal";
import { requireRole } from "@/lib/authorization";

export default async function Page() {
  await requireRole(["student"]);
  return <StudentPortal />;
}
