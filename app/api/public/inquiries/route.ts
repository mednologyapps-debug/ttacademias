import {failure,publicAcademy,EnrollmentError} from "@/lib/enrollment";
import {acceptInquiry,deliverInquiry,validInquiryId} from "@/lib/inquiries";

export async function POST(request:Request) {
  try {
    if(!request.headers.get("content-type")?.startsWith("application/json")) throw new EnrollmentError("Formato inválido.",415);
    const body=await request.json().catch(()=>null);
    const message=typeof body?.message==="string"?body.message.trim():"";
    if(!validInquiryId(body?.id)||!message||message.length>2000)throw new EnrollmentError("Escribe un mensaje de hasta 2000 caracteres.",400);
    const academy=await publicAcademy();
    const fresh=await acceptInquiry(academy,body.id,message);
    if(fresh) await deliverInquiry(academy,body.id);
    return Response.json({received:true},{status:201});
  } catch(e){return failure(e);}
}
