import StudentPortal from "../student-portal";
import { requireRole } from "@/lib/authorization";

export default async function StudentPage() {
  const user=await requireRole(["student"]);
  return <StudentPortal name={user.name} academy={user.academyName||"TT Academias"} email={user.email} />;
}
