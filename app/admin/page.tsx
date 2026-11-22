import AdminPanel from "./admin-panel";
import { requireRole } from "@/lib/authorization";

export default async function AdminPage() {
  const user=await requireRole(["academy_admin"]);
  return <AdminPanel adminName={user.name} />;
}
