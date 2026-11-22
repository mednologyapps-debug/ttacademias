import {adminAcademy,EnrollmentError,failure} from "@/lib/enrollment";
import {validEmail} from "@/lib/enrollment-types";
import {deliverInquiry,validInquiryId} from "@/lib/inquiries";
import {getDb} from "@/lib/db";

export async function PUT(request:Request) {
  try {
    const academy=await adminAcademy();
    const {email}=await request.json();
    if(typeof email!=="string" || !validEmail(email.trim())) throw new EnrollmentError("Revisa el correo de destino.",400);
    await getDb().execute("INSERT INTO academy_operations (academy_id,record_key,revision,payload) VALUES (?,'mail:inquiries',1,?) ON DUPLICATE KEY UPDATE revision=revision+1,payload=VALUES(payload)",[academy,JSON.stringify(email.trim().toLowerCase())]);
    return Response.json({ok:true});
  } catch(e){return failure(e);}
}
export async function POST(request:Request) {
  try {
    const academy=await adminAcademy();
    const {id}=await request.json();
    if(!validInquiryId(id)) throw new EnrollmentError("Consulta inválida.",400);
    if(!await deliverInquiry(academy,id)) throw new EnrollmentError("El correo sigue pendiente. Verifica el destinatario y el correo saliente de la academia.",503);
    return Response.json({sent:true});
  } catch(e){return failure(e);}
}
