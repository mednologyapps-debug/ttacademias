import { requireRole } from "@/lib/authorization";
import StudentPortal from "../student-portal";

export default async function StudentHomePage() {
  const user=await requireRole(["student"]);
  return <StudentPortal name={user.name} academy={user.academyName||"TT Academias"} email={user.email} />;
}
