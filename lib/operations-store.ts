import {projectCourses} from "./course-projection";
import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import path from "node:path";
import type {ResultSetHeader,RowDataPacket} from "mysql2";
import {getDb} from "./db";
import {EnrollmentError} from "./enrollment";
import type {Course,Finance} from "./course-finance";
export type RecordState<T> = {revision:number;value:T};
export type Records = Record<string,RecordState<unknown>>;
const file=path.join(process.cwd(),".local-enrollment","operations.json");
const demo=(id:string)=>process.env.NODE_ENV==="development" && id==="local-enrollment-demo";
const locks=globalThis as typeof globalThis & { academyOpsQueue?:Promise<void> };
async function demoRead():Promise<Records> {
  try { return JSON.parse(await readFile(file,"utf8")); }
  catch(e) { if((e as NodeJS.ErrnoException).code==="ENOENT") return {}; throw e; }
}
export async function records(academy:string,tournamentsOnly=false):Promise<Records> {
  if(demo(academy)) return demoRead();
  const [rows]=await getDb().execute<RowDataPacket[]>("SELECT record_key,revision,CAST(payload AS CHAR CHARACTER SET utf8mb4) AS payload FROM academy_operations WHERE academy_id=?"+(tournamentsOnly?" AND record_key LIKE 'event:%'":""),[academy]);
  return Object.fromEntries(rows.map(r=>[r.record_key,{revision:r.revision,value:typeof r.payload==="string"?JSON.parse(r.payload):r.payload}]));
}
export async function record(academy:string,key:string):Promise<RecordState<unknown>|undefined> {
  if(demo(academy))return (await demoRead())[key];
  const [rows]=await getDb().execute<RowDataPacket[]>("SELECT revision,CAST(payload AS CHAR CHARACTER SET utf8mb4) AS payload FROM academy_operations WHERE academy_id=? AND record_key=?",[academy,key]);
  if(!rows.length)return undefined;
  return {revision:rows[0].revision,value:typeof rows[0].payload==="string"?JSON.parse(rows[0].payload):rows[0].payload};
}
export async function adminRecords(academy:string) {
  const result=await records(academy);
  if(demo(academy))return result;
  const [students]=await getDb().execute<RowDataPacket[]>("SELECT id,full_name,dni,DATE_FORMAT(birth_date,'%Y-%m-%d') birth,email,phone FROM users WHERE academy_id=? AND role='student' AND status='active' ORDER BY full_name",[academy]);
  result.roster={revision:0,value:students.map(u=>[u.full_name,u.dni||"",u.birth||"",String(result["level:"+u.id]?.value||"Sin asignar"),u.email,u.phone||"","Activo"])};
  if(result.finance)return result;
  const db=getDb();
  const query=(sql:string)=>db.execute<RowDataPacket[]>(sql,[academy]).then(([rows])=>rows);
  const [catalog,teachers,members,schedule]=await Promise.all([
    query("SELECT id,name,level,price,DATE_FORMAT(starts_on,'%Y-%m-%d') starts,DATE_FORMAT(ends_on,'%Y-%m-%d') ends FROM courses WHERE academy_id=? ORDER BY name"),
    query("SELECT full_name,email,phone,DATE_FORMAT(birth_date,'%Y-%m-%d') birth FROM users WHERE academy_id=? AND role='teacher' ORDER BY full_name"),
    query("SELECT c.id,u.full_name,u.role FROM courses c JOIN (SELECT teacher_id user_id,course_id FROM course_teachers UNION ALL SELECT student_id,course_id FROM course_students) m ON c.id=m.course_id JOIN users u ON u.id=m.user_id AND u.academy_id=c.academy_id WHERE c.academy_id=?"),
    query("SELECT s.course_id,s.weekday,TIME_FORMAT(s.starts_at,'%l:%i %p') hour FROM course_slots s JOIN courses c ON c.id=s.course_id WHERE c.academy_id=? ORDER BY weekday,starts_at")
  ]);
  const levels:Record<string,string>={basic:"Básico",intermediate:"Intermedio",advanced:"Avanzado"};
  const days=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const courses:Course[]=catalog.map(c=>{
    const roster=members.filter(m=>m.id===c.id);
    return {id:c.id,name:c.name,level:levels[c.level],price:String(c.price),starts:c.starts,ends:c.ends,
      teachers:roster.filter(m=>m.role==="teacher").map(m=>m.full_name),students:roster.filter(m=>m.role==="student").map(m=>m.full_name),
      slots:schedule.filter(s=>s.course_id===c.id).map(s=>days[s.weekday%7]+" · "+s.hour)};
  });
  const finance:Finance={courses,teachers:teachers.map(t=>{
    const assigned=courses.filter(c=>c.teachers.includes(t.full_name));
    return [t.full_name,t.birth||"",[...new Set(assigned.map(c=>c.level))].join(" · "),t.email,t.phone||"",[...new Set(assigned.flatMap(c=>c.slots))].join(" | ")];
  }),receipts:[],contracts:[]};
  return {...result,finance:{revision:0,value:finance}};
}
export function operationsFailure(error:unknown) {
  return Response.json({error:error instanceof EnrollmentError?error.message:"No se pudieron consultar o guardar los datos de la academia."},
    {status:error instanceof EnrollmentError?error.status:503,headers:{"Cache-Control":"no-store"}});
}
const conflict=()=>new EnrollmentError("Otro administrador guardó cambios. Se actualizaron los datos. Revisa y vuelve a guardar.",409);
export async function saveRecord(academy:string,key:string,expected:number,value:unknown) {
  const revision=expected+1;
  if(demo(academy)) {
    const task=(locks.academyOpsQueue || Promise.resolve()).then(async()=>{
      const data=await demoRead();
      if((data[key]?.revision||0)!==expected) throw conflict();
      data[key]={revision,value};
      await mkdir(path.dirname(file),{recursive:true,mode:0o700});const tmp=file+"."+randomUUID();
      await writeFile(tmp,JSON.stringify(data),{mode:0o600});await rename(tmp,file);
    });
    locks.academyOpsQueue=task.catch(()=>{});await task;
  } else if(!expected) {
    try { await getDb().execute("INSERT INTO academy_operations (academy_id,record_key,revision,payload) VALUES (?,?,1,?)",[academy,key,JSON.stringify(value)]); }
    catch(e) { if((e as {code?:string}).code==="ER_DUP_ENTRY") throw conflict(); throw e; }
  } else {
    const [r]=await getDb().execute<ResultSetHeader>("UPDATE academy_operations SET payload=?,revision=revision+1 WHERE academy_id=? AND record_key=? AND revision=?",[JSON.stringify(value),academy,key,expected]);
    if(!r.affectedRows) throw conflict();
  }
  return {revision,value};
}


export async function saveFinance(academy:string,expected:number,data:Finance,password?:string) {
  if(demo(academy))return saveRecord(academy,"finance",expected,data);
  const db=await getDb().getConnection();
  try{
    await db.beginTransaction();
    // Serialize first saves as well as updates.
    await db.execute("SELECT id FROM academies WHERE id=? FOR UPDATE",[academy]);
    const [rows]=await db.execute<RowDataPacket[]>("SELECT revision,CAST(payload AS CHAR CHARACTER SET utf8mb4) AS payload FROM academy_operations WHERE academy_id=? AND record_key='finance' FOR UPDATE",[academy]);
    if((rows[0]?.revision||0)!==expected)throw conflict();
    const raw=rows[0]?.payload;
    await projectCourses(db,academy,data,typeof raw==="string"?JSON.parse(raw):raw,password);
    await db.execute("INSERT INTO academy_operations (academy_id,record_key,revision,payload) VALUES (?,'finance',?,?) ON DUPLICATE KEY UPDATE revision=VALUES(revision),payload=VALUES(payload)",[academy,expected+1,JSON.stringify(data)]);
    await db.commit();
    return {revision:expected+1,value:data};
  }catch(e){await db.rollback();throw e;}finally{db.release();}
}
