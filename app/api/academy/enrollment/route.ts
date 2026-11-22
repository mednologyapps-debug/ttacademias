import {inquiryInbox} from "@/lib/inquiries";
import { randomUUID } from "node:crypto";
import { addOffer, adminAcademy, EnrollmentError, failure, inbox, offers, removeOffer } from "@/lib/enrollment";
import { enrollmentLevels } from "@/lib/enrollment-types";

export async function GET(request: Request) {
  try {
    const academy = await adminAcademy();
    const data = new URL(request.url).searchParams.get("view") === "offers" ? { offers:await offers(academy) } : { requests:await inbox(academy),inquiries:academy==="local-enrollment-demo"?[]:await inquiryInbox(academy) };
    return Response.json(data,{headers:{"Cache-Control":"private, no-store"}});
  } catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  try {
    const academy = await adminAcademy();
    const data = await request.json();
    const venue = String(data.venue || "").trim();
    const schedule = String(data.schedule || "").trim();
    if (!venue || venue.length > 120 || !schedule || schedule.length > 120 || !enrollmentLevels.includes(data.level)) throw new EnrollmentError("Completa sede, nivel y horario.",400);
    await addOffer(academy,{id:randomUUID(),venue,level:data.level,schedule});
    return Response.json({ok:true},{status:201});
  } catch(e) { return failure(e); }
}
export async function DELETE(request: Request) {
  try {
    const academy = await adminAcademy();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new EnrollmentError("Elige un horario.",400);
    await removeOffer(academy,id); return Response.json({ok:true});
  } catch(e) { return failure(e); }
}
