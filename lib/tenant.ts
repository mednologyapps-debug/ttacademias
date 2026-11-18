import { headers } from "next/headers";

export async function getAcademySlug(): Promise<string | null> {
  const headerList = await headers();
  const host = (headerList.get("x-forwarded-host") || headerList.get("host") || "").split(":")[0].toLowerCase();
  const baseDomain = (process.env.BASE_DOMAIN || "ttacademias.com").toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return process.env.DEFAULT_ACADEMY_SLUG || null;
  if (!host.endsWith(`.${baseDomain}`)) return null;
  const slug = host.slice(0, -(baseDomain.length + 1));
  return slug && !slug.includes(".") ? slug : null;
}
