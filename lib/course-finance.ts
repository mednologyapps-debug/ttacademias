import type {AttendanceMark,Lesson} from "./teaching-ledger";
export type Course = { id:string; name:string; level:string; teachers:string[]; students:string[]; price:string; starts:string; ends:string; slots:string[] };
export type Contract = { courseId:string; teacher:string; role:"Principal"|"De apoyo"; cents:number };
export type Receipt = { id:string; courseId:string; student:string; cents:number; date:string };
export type Finance = { courses:Course[]; teachers:string[][]; contracts:Contract[]; receipts:Receipt[]; attendance?:AttendanceMark[]; lessons?:Lesson[] };
export function validateFinance(f:Finance) {
  if(!f || ![f.courses,f.teachers,f.contracts,f.receipts].every(Array.isArray)) throw Error("Datos de cursos inválidos.");
  const ids=new Set(f.courses.map(c=>c.id));
  const teachers=new Set(f.teachers.map(t=>t[0]));
  const validAmount=(n:number)=>Number.isSafeInteger(n) && n>=0 && n<=9999999999;
  const marks=f.attendance??[];
  if(!Array.isArray(marks) || !marks.every(m=>ids.has(m.courseId) && teachers.has(m.teacher) && m.lessonId && ["taught","missed","pending"].includes(m.state) && Date.parse(m.startsAt)<=Date.now())
    || new Set(marks.map(m=>JSON.stringify([m.courseId,m.teacher,m.lessonId]))).size!==marks.length)throw Error("Asistencia docente inválida.");
  if(f.lessons && (!Array.isArray(f.lessons) || !f.lessons.every(s=>s.id && ids.has(s.courseId) && Number.isFinite(Date.parse(s.startsAt)) && s.teacher && teachers.has(s.teacher))))throw Error("Clase inválida.");
  if(teachers.size!==f.teachers.length || ids.size!==f.courses.length || !f.courses.every(c=>c.id && c.name && [c.students,c.teachers,c.slots].every(Array.isArray))
    || !f.teachers.every(t=>t.length===6 && t.every(v=>typeof v==="string"))
    || !f.contracts.every(c=>ids.has(c.courseId) && teachers.has(c.teacher) && f.courses.some(course=>course.id===c.courseId && course.teachers.includes(c.teacher)) && ["Principal","De apoyo"].includes(c.role) && validAmount(c.cents))
    || new Set(f.contracts.map(c=>JSON.stringify([c.courseId,c.teacher]))).size!==f.contracts.length
    || !f.receipts.every(r=>r.id && ids.has(r.courseId) && r.student && validAmount(r.cents) && r.cents>0 && /^\d{4}-\d{2}-\d{2}$/.test(r.date))
    || new Set(f.receipts.map(r=>r.id)).size!==f.receipts.length) throw Error("Revisa los cursos, importes y asignaciones.");
}
export function courseTotals(f: Finance, courseId:string) {
  const income=f.receipts.filter(r=>r.courseId===courseId).reduce((n,r)=>n+r.cents,0);
  const fees=f.contracts.filter(c=>c.courseId===courseId).reduce((n,c)=>n+c.cents,0);
  return {income,fees,balance:income-fees};
}
