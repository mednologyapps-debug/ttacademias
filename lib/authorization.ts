import { redirect } from "next/navigation";
import { getCurrentUser, type AuthUser } from "@/lib/auth";

export async function requireRole(roles: string[]): Promise<AuthUser> {
  let user: AuthUser | null = null;
  try { user = await getCurrentUser(); } catch { redirect("/login?setup=database"); }
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) {
    const home = user.role === "global_admin" ? "/global-admin" : user.role === "academy_admin" ? "/admin" : user.role === "teacher" ? "/profesores" : "/alumno";
    redirect(home);
  }
  return user;
}
