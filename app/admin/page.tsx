import AdminPanel from "./admin-panel";
import { requireRole } from "@/lib/authorization";

export default async function AdminPage() {
  await requireRole(["academy_admin"]);
  return <AdminPanel />;
}
