import { requireRole } from "@/lib/authorization";
import GlobalAdminDashboard from "./global-admin-dashboard";
export default async function GlobalAdminPage() { await requireRole(["global_admin"]); return <GlobalAdminDashboard />; }
