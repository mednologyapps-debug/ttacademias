import {adminAcademy,EnrollmentError} from "@/lib/enrollment";
import {adminRecords,record,saveRecord,operationsFailure} from "@/lib/operations-store";
import {transition,type Tournament} from "@/lib/tournament";
import {recordedLessons} from "@/lib/recorded-lessons";
import {courseLessons,teacherPay} from "@/lib/teaching-ledger";
import {validateFinance,type Finance} from "@/lib/course-finance";
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
      const draft:Finance=value;
      if(draft.attendance?.length){
        const previous=await record(academy,key);
        if((previous?.revision||0)!==revision)throw new EnrollmentError("Los datos cambiaron. Revisa la última versión.",409);
        const original=(previous?.value as Finance|undefined)?.attendance||[];
        const changes=draft.attendance.filter(m=>!original.some(old=>old.lessonId===m.lessonId && old.courseId===m.courseId && old.teacher===m.teacher && old.state===m.state && old.startsAt===m.startsAt));
        if(changes.length){
          const recorded=await recordedLessons(academy);
          for(const mark of changes){
            const course=draft.courses.find(c=>c.id===mark.courseId && c.teachers.includes(mark.teacher));
            const fee=draft.contracts.find(c=>c.courseId===mark.courseId && c.teacher===mark.teacher);
            const session=course && teacherPay(course,mark.teacher,fee,courseLessons(course,recorded,draft.lessons||[]),[]).entries.find(s=>s.id===mark.lessonId);
            if(!session || session.state==="future" || Date.parse(session.startsAt)!==Date.parse(mark.startsAt))throw new EnrollmentError("Verifica la fecha y la asignación de la clase antes de registrar la asistencia.",400);
          }
        }
      }
      next=value;
    } else {
      if(!/^event:[\w-]{1,100}$/.test(key)) throw new EnrollmentError("Ranking inválido.",400);
      const existing=await record(academy,key);
      if((existing?.revision||0)!==revision) throw new EnrollmentError("El ranking cambió. Revisa los resultados actualizados.",409);
      try {
        if(action.kind==="confirm" && key!=="event:"+action.event.id) throw Error("Identificador incorrecto.");
        next=transition(existing?.value as Tournament || null,action);
      } catch(e){throw new EnrollmentError(e instanceof Error?e.message:"Resultado inválido.",400);}
    }
    return Response.json(await saveRecord(academy,key,revision,next));
  } catch(e){return operationsFailure(e);}
}
