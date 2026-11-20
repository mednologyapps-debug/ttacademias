import {adminAcademy,EnrollmentError} from "@/lib/enrollment";
import {adminRecords,record,saveRecord,operationsFailure} from "@/lib/operations-store";
import {transition,type Tournament} from "@/lib/tournament";
import {validateFinance} from "@/lib/course-finance";
export async function GET() {
  try { return Response.json(await adminRecords(await adminAcademy()),{headers:{"Cache-Control":"private, no-store"}}); } catch(e){return operationsFailure(e);}
}
export async function POST(request:Request) {
  try {
    const academy=await adminAcademy();
    const {key,revision,action,value}=await request.json();
    if(typeof key!=="string" || !Number.isSafeInteger(revision) || revision<0) throw new EnrollmentError("Solicitud inválida.",400);
    let next;
    if(key==="finance") {
      try {validateFinance(value);} catch {throw new EnrollmentError("Revisa los importes y los cursos asociados.",400);}
      next=value;
    } else {
      if(!/^event:[\w-]{1,100}$/.test(key)) throw new EnrollmentError("Ranking inválido.",400);
      const existing=await record(academy,key);
      if((existing?.revision||0)!==revision) throw new EnrollmentError("El ranking cambió. Revisa los resultados actualizados.",409);
      try {
        if(action.kind==="start" && key!=="event:"+action.event.id) throw Error("Identificador incorrecto.");
        next=transition(existing?.value as Tournament || null,action);
      } catch(e){throw new EnrollmentError(e instanceof Error?e.message:"Resultado inválido.",400);}
    }
    return Response.json(await saveRecord(academy,key,revision,next));
  } catch(e){return operationsFailure(e);}
}
