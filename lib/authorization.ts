import { redirect } from "next/navigation";
import { getCurrentUser, type AuthUser } from "@/lib/auth";

export async function requireRole(roles: string[]): Promise<AuthUser> {
  let user: AuthUser | null = null;
  try { user = await getCurrentUser(); } catch { redirect("/login?setup=database"); }
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(user.role === "global_admin" ? "/login?role=global_admin" : "/");
  return user;
}
