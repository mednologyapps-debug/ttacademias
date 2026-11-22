import {createHash} from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.academyId) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const [rows] = await getDb().query<({ name: string; logoUrl: string | null; primaryColor: string } & RowDataPacket)[]>("SELECT name,logo_url AS logoUrl,primary_color AS primaryColor FROM academies WHERE id=? LIMIT 1", [user.academyId]);
  return NextResponse.json({ academy: rows[0] });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "academy_admin" || !user.academyId) return NextResponse.json({ error: "Solo el administrador de academia puede cambiar su marca." }, { status: 403 });
  const multipart = request.headers.get("content-type")?.startsWith("multipart/form-data");
  if (Number(request.headers.get("content-length")) > 2_000_000) return NextResponse.json({error:"El archivo es demasiado grande."},{status:413});
  const body = multipart ? Object.fromEntries(await request.formData()) : await request.json();
  const name = String(body.name || "").trim(), color = String(body.primaryColor || "");
  let logo = String(body.logoUrl || "").trim() || null;
  const uploaded = body.logo;
  const internal = !!logo && /^\/api\/public\/logo\?v=[a-f0-9]{32}$/.test(logo);
  if (name.length < 3 || name.length > 160 || !/^#[0-9a-fA-F]{6}$/.test(color) || (logo && !internal && (!logo.startsWith("https://") || logo.length > 500)))
    return NextResponse.json({error:"Revisa el nombre, el color y el logo."},{status:400});
  let image: Buffer | undefined;
  if (uploaded) {
    if (!(uploaded instanceof File) || uploaded.size > 1_500_000 || uploaded.size < 36)
      return NextResponse.json({error:"Selecciona una imagen válida."},{status:400});
    image = Buffer.from(await uploaded.arrayBuffer());
    if (image.subarray(0,8).toString("hex") !== "89504e470d0a1a0a" || image.toString("ascii",12,16) !== "IHDR" ||
        image.readUInt32BE(16)>512 || image.readUInt32BE(20)>512 || image.toString("ascii",image.length-8,image.length-4)!=="IEND")
      return NextResponse.json({error:"La imagen no tiene un formato válido."},{status:400});
    logo="/api/public/logo?v="+createHash("sha256").update(image).digest("hex").slice(0,32);
  }
  const db=await getDb().getConnection();
  try {
    await db.beginTransaction();
    const [rows]=await db.execute<RowDataPacket[]>("SELECT logo_url FROM academies WHERE id=? FOR UPDATE",[user.academyId]);
    if (!rows.length || (!image && internal && rows[0].logo_url !== logo)) {
      await db.rollback();
      return NextResponse.json({error:"El logo cambió. Actualiza la página."},{status:409});
    }
    if (image) await db.execute("INSERT INTO academy_operations (academy_id,record_key,revision,payload) VALUES (?,'brand:logo',1,?) ON DUPLICATE KEY UPDATE revision=revision+1,payload=VALUES(payload)",[user.academyId,JSON.stringify({image:image.toString("base64")})]);
    else if (!internal) await db.execute("DELETE FROM academy_operations WHERE academy_id=? AND record_key='brand:logo'",[user.academyId]);
    await db.execute("UPDATE academies SET name=?,primary_color=?,logo_url=? WHERE id=?",[name,color,logo,user.academyId]);
    await db.commit();
    return NextResponse.json({ok:true,logoUrl:logo});
  } catch {
    await db.rollback();
    return NextResponse.json({error:"No se pudo guardar la marca. Intenta de nuevo."},{status:503});
  } finally { db.release(); }
}
