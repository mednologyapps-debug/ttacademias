"use client";
import {useState} from "react";
import {courseTotals,type Course,type Finance,type Receipt,type Contract} from "@/lib/course-finance";
import "./competition.css";
const currency=(c:number)=>new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN"}).format(c/100);
export type DraftFee={courseId:string;role:Contract["role"];amount:string};
export function AssignmentFields({courses,fees,change}:{courses:Course[];fees:DraftFee[];change:(f:DraftFee[])=>void}) {
  return <fieldset><legend>Cursos y honorarios</legend>{courses.map(course=>{
    const fee=fees.find(f=>f.courseId===course.id);
    const update=(patch:Partial<DraftFee>)=>change(fees.map(f=>f.courseId===course.id?{...f,...patch}:f));
    return <div key={course.id} className="ops-contract"><label><span><input type="checkbox" checked={!!fee} onChange={()=>change(fee?fees.filter(f=>f!==fee):[...fees,{courseId:course.id,role:"Principal",amount:""}])}/> {course.name}</span></label>
      {fee&&<><label>Función<select value={fee.role} onChange={e=>update({role:e.target.value as Contract["role"]})}><option>Principal</option><option>De apoyo</option></select></label>
      <label>Pago total del curso (S/)<input required type="number" min="0" step=".01" max="99999999.99" value={fee.amount} onChange={e=>update({amount:e.target.value})}/></label></>}</div>;})}</fieldset>;
}
export default function CourseLedger({data,save,busy}:{data:Finance;save:(r:Receipt)=>Promise<boolean>;busy:boolean}) {
  const [courseId,setCourse]=useState(""),[student,setStudent]=useState(""),[amount,setAmount]=useState("");
  const chosen=data.courses.find(c=>c.id===courseId);
  return <section className="ops-card"><h2>Ingresos y honorarios por curso</h2>
    <form className="ops-controls" onSubmit={async e=>{e.preventDefault();if(!chosen||!student.trim())return;
      if(await save({id:crypto.randomUUID(),courseId,student:student.trim(),cents:Math.round(Number(amount)*100),date:new Date().toLocaleDateString("sv-SE",{timeZone:"America/Lima"})})){setAmount("");setStudent("");}}}>
      <label>Curso<select required value={courseId} onChange={e=>{setCourse(e.target.value);setStudent("");}}><option value="">Elige un curso</option>{data.courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Alumno o concepto<input required value={student} list="course-payers" onChange={e=>setStudent(e.target.value)}/></label><datalist id="course-payers">{chosen?.students.map(n=><option key={n}>{n}</option>)}</datalist>
      <label>Importe cobrado (S/)<input required type="number" min=".01" max="99999999.99" step=".01" value={amount} onChange={e=>setAmount(e.target.value)}/></label><button className="admin-primary-button" disabled={busy}>Registrar cobro</button></form>
    {data.courses.map(c=>{const totals=courseTotals(data,c.id);
      const pending=c.teachers.some(n=>!data.contracts.some(f=>f.courseId===c.id && f.teacher===n));
      return <details className="ops-card" key={c.id}><summary><strong>{c.name}</strong> · Cobrado {currency(totals.income)} · Honorarios {currency(totals.fees)} · {pending?"Saldo provisional":"Saldo"} {currency(totals.balance)}{pending?" · Faltan honorarios":""}</summary>
        <h3>Docentes</h3>{c.teachers.map(n=>{const f=data.contracts.find(f=>f.courseId===c.id && f.teacher===n);return <div className="ops-match" key={n}><span>{n} · {f?.role||"Función por definir"}</span><strong>{f?currency(f.cents):"Honorarios por configurar"}</strong></div>;})}
        <h3>Cobros registrados</h3>{data.receipts.filter(r=>r.courseId===c.id).map(r=><div className="ops-match" key={r.id}><span>{r.date} · {r.student}</span><strong>{currency(r.cents)}</strong></div>)}{!totals.income&&<p>Aún no hay cobros registrados para este curso.</p>}
      </details>;})}
    <details className="ops-card"><summary><strong>Total por profesor</strong></summary>
      {data.teachers.map(([name])=>{
        const items=data.contracts.filter(f=>f.teacher===name);
        return <div className="ops-match" key={name}><span>{name}<small className="ops-subline">{items.map(f=>data.courses.find(c=>c.id===f.courseId)?.name).join(" · ")}</small></span><strong>{items.length?currency(items.reduce((sum,f)=>sum+f.cents,0)):"Honorarios por configurar"}</strong></div>;
      })}
    </details></section>;
}
