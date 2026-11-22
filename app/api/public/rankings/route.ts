import {randomUUID} from "node:crypto";
import type {RowDataPacket} from "mysql2";
import {getCurrentUser} from "@/lib/auth";
import {getDb} from "@/lib/db";
import {EnrollmentError,publicAcademy} from "@/lib/enrollment";
import {operationsFailure,record,saveRecord} from "@/lib/operations-store";
import {registrationOpen} from "@/lib/public-rankings";
import {transition,type Tournament} from "@/lib/tournament";

export async function POST(request:Request) {
  try {
    const academy=await publicAcademy();
    const {id,dni,name,submit,expectedPrice}=await request.json();
    if(typeof id!=="string" || !/^[\w-]{1,100}$/.test(id) || typeof dni!=="string" || !/^\d{8}$/.test(dni))throw new EnrollmentError("Revisa el ranking y el DNI de 8 dígitos.",400);
    const user=await getCurrentUser();
    const isStudent=user?.role==="student" && user.academyId===academy;
    let student=!!isStudent;
    if(academy!=="local-enrollment-demo"){
      const [rows]=await getDb().execute<RowDataPacket[]>("SELECT id,dni FROM users WHERE academy_id=? AND status='active' AND role='student' AND (dni=? OR id=?)",[academy,dni,isStudent?user.id:""]);
      const account=rows.find(row=>row.id===user?.id);
      if(account?.dni && account.dni!==dni || account && rows.some(row=>row.id!==account.id))throw new EnrollmentError("Usa el DNI de tu cuenta.",400);
      student=rows.length>0;
    }
    const key="event:"+id;
    for(let attempt=0;attempt<3;attempt++){
      const state=await record(academy,key);
      const event=state?.value as Tournament|undefined;
      if(!event || !registrationOpen(event))throw new EnrollmentError("Las inscripciones están cerradas.",409);
      const e=event.event;
      const price=student?e.studentPrice:e.publicPrice;
      if(!submit)return Response.json({price,kind:student?"Alumno":"Externo"});
      if(expectedPrice!==undefined && expectedPrice!==price)throw new EnrollmentError("La tarifa cambió. Vuelve a revisar los datos.",409);
      const fullName=isStudent?user.name:String(name||"").trim();
      if(fullName.length<2 || fullName.length>160)throw new EnrollmentError("Escribe tu nombre y apellido.",400);
      if(e.participants.some(p=>p.dni===dni || isStudent && p.id===user.id))throw new EnrollmentError("Ya hay una inscripción con estos datos.",409);
      if(e.participants.length>=e.capacity)throw new EnrollmentError("Ya se completaron los cupos.",409);
      const entry={id:isStudent?user.id:randomUUID(),name:fullName,kind:student?"Alumno" as const:"Externo" as const,dni,weight:5,paid:price===0};
      const next=transition(event,{kind:"save",event:{...e,participants:[...e.participants,entry]}});
      try{
        await saveRecord(academy,key,state!.revision,next);
        return Response.json({ok:true,confirmed:entry.paid,price},{status:201});
      }catch(error){if(!(error instanceof EnrollmentError) || error.status!==409 || attempt===2)throw error;}
    }
  }catch(error){return operationsFailure(error);}
}
