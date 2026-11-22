import {createHash,randomUUID} from "node:crypto";
import type {PoolConnection,RowDataPacket} from "mysql2/promise";
import bcrypt from "bcryptjs";
import type {Finance} from "./course-finance";
import {EnrollmentError} from "./enrollment";
import {slotTime} from "./teaching-ledger";

export async function projectCourses(db:PoolConnection, academy:string, data:Finance, old:Finance|undefined, password?:string) {
  const [users]=await db.execute<RowDataPacket[]>("SELECT id,full_name,email,role,status FROM users WHERE academy_id=?",[academy]);
  for(const [name,birth,,email,phone] of data.teachers){
    const existing=users.find(u=>u.email.toLowerCase()===email.toLowerCase());
    if(existing && existing.role!=="teacher")throw new EnrollmentError("Ese correo pertenece a otra cuenta.",409);
    if(existing){
      await db.execute("UPDATE users SET full_name=?,birth_date=?,phone=? WHERE id=? AND academy_id=?",[name,birth||null,phone||null,existing.id,academy]);
      existing.full_name=name;
    }else{
      if(!password || password.length<10)throw new EnrollmentError("Define una contraseña inicial de 10 caracteres para el profesor.",400);
      const id=randomUUID();
      await db.execute("INSERT INTO users (id,academy_id,email,password_hash,full_name,birth_date,phone,role) VALUES (?,?,?,?,?,?,?,'teacher')",[id,academy,email.toLowerCase(),await bcrypt.hash(password,12),name,birth||null,phone||null]);
      users.push({id,full_name:name,email,role:"teacher",status:"active"} as RowDataPacket);
    }
  }
  for(const receipt of data.receipts){
    const existing=old?.receipts.find(r=>r.id===receipt.id);
    if(existing?.studentId){receipt.studentId=existing.studentId;continue;}
    const matches=users.filter(u=>u.role==="student" && u.full_name===receipt.student);
    if(matches.length===1)receipt.studentId=matches[0].id;
    else delete receipt.studentId;
  }
  const member=(name:string,role:string)=>{
    const matches=users.filter(u=>u.status==="active" && u.role===role && u.full_name===name);
    if(matches.length!==1)throw new EnrollmentError("Revisa la cuenta asignada a "+name+". Debe haber una sola cuenta activa con ese nombre.",400);
    return matches[0].id as string;
  };
  const levels:Record<string,string>={"Básico":"basic","Intermedio":"intermediate","Avanzado":"advanced"};
  for(const c of data.courses){
    const prior=old?.courses.find(v=>v.id===c.id);
    const [stored]=await db.execute<RowDataPacket[]>("SELECT academy_id FROM courses WHERE id=? FOR UPDATE",[c.id]);
    if(stored.length && stored[0].academy_id===academy && prior && JSON.stringify(prior)===JSON.stringify(c))continue;
    const values=[c.name,levels[c.level],c.starts,c.ends,c.price];
    if(stored.length){
      if(stored[0].academy_id!==academy)throw new EnrollmentError("Curso inválido.",400);
      await db.execute("UPDATE courses SET name=?,level=?,starts_on=?,ends_on=?,price=? WHERE id=? AND academy_id=?",[...values,c.id,academy]);
    }else await db.execute("INSERT INTO courses (name,level,starts_on,ends_on,price,id,academy_id) VALUES (?,?,?,?,?,?,?)",[...values,c.id,academy]);
    for(const role of ["teacher","student"] as const){
      const table=role==="teacher"?"course_teachers":"course_students", column=role+"_id";
      await db.execute("DELETE FROM "+table+" WHERE course_id=?",[c.id]);
      for(const name of new Set(c[role==="teacher"?"teachers":"students"]))await db.execute("INSERT INTO "+table+" (course_id,"+column+") VALUES (?,?)",[c.id,member(name,role)]);
    }
    await db.execute("DELETE FROM course_slots WHERE course_id=?",[c.id]);
    for(const slot of c.slots){
      const weekday=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].indexOf(slot.slice(0,3)),time=slotTime(slot);
      if(!time || weekday<0)throw new EnrollmentError("Horario de curso inválido.",400);
      await db.execute("INSERT INTO course_slots (id,course_id,weekday,starts_at) VALUES (?,?,?,?)",[randomUUID(),c.id,weekday,time]);
    }
  }
  for(const c of old?.courses||[])if(!data.courses.some(v=>v.id===c.id))await db.execute("UPDATE courses SET status='closed' WHERE id=? AND academy_id=?",[c.id,academy]);
  for(const t of old?.teachers||[])if(!data.teachers.some(v=>v[3]===t[3]))await db.execute("UPDATE users SET status='suspended' WHERE academy_id=? AND role='teacher' AND email=?",[academy,t[3]]);
  for(const lesson of data.lessons||[]){
    const id=createHash("sha256").update([academy,lesson.courseId,lesson.id].join("|")).digest("hex").slice(0,36);
    lesson.projectedId=id;
    const prior=old?.lessons?.find(s=>s.courseId===lesson.courseId && s.id===lesson.id);
    if(prior && JSON.stringify(prior)===JSON.stringify(lesson))continue;
    const teacher=member(lesson.teacher!,"teacher");
    const [existing]=await db.execute<RowDataPacket[]>("SELECT id FROM classes WHERE id=? AND academy_id=?",[id,academy]);
    if(existing.length)await db.execute("UPDATE classes SET title=?,teacher_id=?,status=IF(?='cancelled','cancelled',status) WHERE id=? AND academy_id=?",[lesson.title,teacher,lesson.status||"scheduled",id,academy]);
    else await db.execute("INSERT INTO classes (id,academy_id,course_id,teacher_id,title,starts_at,status) VALUES (?,?,?,?,?,?,?)",[id,academy,lesson.courseId,teacher,lesson.title,new Date(lesson.startsAt),lesson.status||"scheduled"]);
  }
}
