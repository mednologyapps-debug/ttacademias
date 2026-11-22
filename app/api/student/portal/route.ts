import type {RowDataPacket,ResultSetHeader} from "mysql2";
import {getCurrentUser} from "@/lib/auth";
import {getDb} from "@/lib/db";
import {record,records,operationsFailure} from "@/lib/operations-store";
import type {Finance} from "@/lib/course-finance";
import type {Tournament} from "@/lib/tournament";

export async function GET(){
  try{
    const user=await getCurrentUser();
    if(user?.role!=="student" || !user.academyId)return Response.json({error:"Inicia sesión como alumno."},{status:403});
    const query=(sql:string)=>getDb().execute<RowDataPacket[]>(sql,[user.academyId,user.id]).then(([rows])=>rows);
    const [classes,courses,payments,memberships,announcements,finance,events]=await Promise.all([
      query("SELECT c.id,c.title,c.starts_at AS startsAt,c.status,co.name AS course,t.full_name AS teacher,a.response FROM classes c JOIN course_students cs ON cs.course_id=c.course_id JOIN courses co ON co.id=c.course_id JOIN users t ON t.id=c.teacher_id LEFT JOIN attendance a ON a.class_id=c.id AND a.student_id=cs.student_id WHERE c.academy_id=? AND cs.student_id=? AND c.status<>'cancelled' ORDER BY c.starts_at"),
      query("SELECT c.name,c.level FROM courses c JOIN course_students cs ON cs.course_id=c.id WHERE c.academy_id=? AND cs.student_id=? AND c.status='active' ORDER BY c.name"),
      query("SELECT id,purpose,amount,status,created_at AS date FROM payments WHERE academy_id=? AND student_id=? ORDER BY created_at DESC"),
      query("SELECT p.name,DATE_FORMAT(m.ends_on,'%Y-%m-%d') AS ends,m.status FROM memberships m JOIN plans p ON p.id=m.plan_id WHERE m.academy_id=? AND m.student_id=? ORDER BY m.ends_on DESC"),
      record(user.academyId,"announcements"),record(user.academyId,"finance"),records(user.academyId,true)
    ]);
    const data=finance?.value as Finance|undefined;
    const manual=(data?.receipts||[]).filter(r=>r.studentId===user.id).map(r=>({id:r.id,purpose:data?.courses.find(c=>c.id===r.courseId)?.name||"Curso",amount:r.cents/100,status:"paid",date:r.date}));
    const entries=Object.entries(events).filter(([key])=>key.startsWith("event:")).flatMap(([,r])=>{
      const t=r.value as Tournament;
      const p=t.event.participants.find(p=>p.id===user.id);
      return p?[{id:t.event.id,title:t.event.title,paid:p.paid,phase:t.phase}]:[];
    });
    return Response.json({classes,courses,payments:[...payments,...manual],memberships,entries,announcements:announcements?.value||[]},{headers:{"Cache-Control":"private,no-store"}});
  }catch(e){return operationsFailure(e);}
}
export async function POST(request:Request){
  try{
    const user=await getCurrentUser();
    if(user?.role!=="student" || !user.academyId)return Response.json({error:"Inicia sesión como alumno."},{status:403});
    const {id,response}=await request.json();
    if(!["yes","no"].includes(response))return Response.json({error:"Respuesta inválida."},{status:400});
    const [r]=await getDb().execute<ResultSetHeader>("INSERT INTO attendance (class_id,student_id,response) SELECT c.id,cs.student_id,? FROM classes c JOIN course_students cs ON cs.course_id=c.course_id WHERE c.academy_id=? AND cs.student_id=? AND c.id=? AND c.starts_at>NOW() AND c.status IN ('scheduled','accepted','rescheduled') ON DUPLICATE KEY UPDATE response=IF(attendance.response IN ('yes','no'),VALUES(response),attendance.response)",[response,user.academyId,user.id,id]);
    if(!r.affectedRows)return Response.json({error:"Ya no puedes modificar la asistencia de esta clase."},{status:409});
    return Response.json({ok:true});
  }catch(e){return operationsFailure(e);}
}
