import type {RowDataPacket} from "mysql2";
import {getAcademySlug} from "@/lib/tenant";
import {getDb} from "@/lib/db";

export async function GET(request:Request) {
  const version = new URL(request.url).searchParams.get("v") || "";
  const slug = await getAcademySlug();
  if (!slug || !/^[a-f0-9]{32}$/.test(version)) return new Response(null,{status:404});
  const [rows] = await getDb().execute<RowDataPacket[]>(
    "SELECT JSON_UNQUOTE(JSON_EXTRACT(o.payload,'$.image')) AS image FROM academies a JOIN academy_operations o ON o.academy_id=a.id AND o.record_key='brand:logo' WHERE a.slug=? AND a.status='active' AND a.logo_url=?",
    [slug,"/api/public/logo?v="+version]);
  if (!rows[0]?.image) return new Response(null,{status:404});
  return new Response(new Uint8Array(Buffer.from(rows[0].image,"base64")), {headers:{
    "Content-Type":"image/png","X-Content-Type-Options":"nosniff","Cache-Control":"public, max-age=86400, immutable",
  }});
}
