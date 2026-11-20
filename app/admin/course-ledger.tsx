"use client";
import {useState,useEffect,useMemo,type FormEvent} from "react";
import {type Course,type Finance,type Receipt,type Contract} from "@/lib/course-finance";
import Modal from "@/components/modal";
import {Banknote, BookOpen, Search, Wallet, X, UserRound} from "lucide-react";
import {courseLessons,teacherPay,type LedgerFeed,type AttendanceMark,type Income} from "@/lib/teaching-ledger";
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
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");
const dateLabel=(s:string)=>new Date(s).toLocaleString("es-PE",{timeZone:"America/Lima",day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
const PAGE=12;
type Props={data:Finance;busy:boolean;save:(r:Receipt)=>Promise<boolean>;mark:(record:AttendanceMark,state:AttendanceMark["state"]|"pending")=>Promise<boolean>};

export default function CourseLedger({data,busy,save,mark}:Props){
  const [tab,setTab]=useState<"teachers"|"income">("teachers");
  const [query,setQuery]=useState(""),[courseFilter,setCourseFilter]=useState("");
  const [limit,setLimit]=useState(PAGE),[selected,setSelected]=useState(""),[adding,setAdding]=useState(false);
  const [markError,setMarkError]=useState("");
  const [feed,setFeed]=useState<LedgerFeed|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    let version=0;
    async function refresh(){
      const current=++version;
      try {
        const res=await fetch("/api/academy/ledger",{cache:"no-store",signal:controller.signal});
        if(!res.ok)throw Error();
        const next=await res.json();if(current===version){setFeed(next);setError(false);}
      }catch{if(!controller.signal.aborted && current===version)setError(true);}
    }
    void refresh();window.addEventListener("focus",refresh);
    return ()=>{controller.abort();window.removeEventListener("focus",refresh);};
  },[retry,tab]);
  const courses=useMemo(()=>data.courses.map(course=>({course,lessons:courseLessons(course,feed?.lessons||[],data.lessons||[])})),[data.courses,data.lessons,feed]);
  const cards=useMemo(()=>data.teachers.map(([name])=>{
    const assigned=courses.filter(({course})=>course.teachers.includes(name)).map(({course,lessons})=>teacherPay(course,name,data.contracts.find(f=>f.teacher===name && f.courseId===course.id),lessons,data.attendance||[]));
    return {name,assigned,net:assigned.reduce((sum,a)=>sum+a.net,0),complete:assigned.length>0&&assigned.every(a=>a.contract)};
  }).sort((a,b)=>a.name.localeCompare(b.name,"es")),[courses,data.teachers,data.contracts,data.attendance]);
  const search=normalize(query);
  const filtered=cards.filter(t=>normalize([t.name,...t.assigned.map(a=>a.course.name)].join(" ")).includes(search));
  const teacher=cards.find(t=>t.name===selected);
  const income:Income[]=[...data.receipts.map(r=>({...r,source:"Manual",concept:"Matrícula"})),...(feed?.income||[])].sort((a,b)=>b.date.localeCompare(a.date));
  const matches=income.filter(r=>(!courseFilter || r.courseId===courseFilter) && normalize([r.student,r.source,r.concept,data.courses.find(c=>c.id===r.courseId)?.name||""].join(" ")).includes(search));
  const filteredCourse=data.courses.find(c=>c.id===courseFilter);
  const payForCourse=cards.flatMap(t=>t.assigned).filter(a=>a.course.id===courseFilter);
  function changeTab(next:typeof tab){setTab(next);setQuery("");setLimit(PAGE);setCourseFilter("");}
  return <section className="ledger-view">
    <nav className="ledger-tabs" aria-label="Vista de pagos"><button aria-pressed={tab==="teachers"} onClick={()=>changeTab("teachers")}><UserRound size={18}/>Pagos a profesores</button><button aria-pressed={tab==="income"} onClick={()=>changeTab("income")}><Wallet size={18}/>Ingresos de la academia</button></nav>
    {error?<p role="alert">No se pudo actualizar la información. <button className="admin-secondary-button" onClick={()=>setRetry(r=>r+1)}>Reintentar</button></p>:!feed?<p role="status">Cargando movimientos y clases…</p>:<>
    <header className="sheet-heading"><div><h2>{tab==="teachers"?"Honorarios docentes":"Ingresos registrados"}</h2><p>{tab==="teachers"?"Consulta el importe de cada profesor y revisa su asistencia por curso.":"Cobros recibidos por la academia, según su fecha y origen."}</p></div>
      {tab==="income" && <button className="admin-primary-button" disabled={busy} onClick={()=>setAdding(true)}>Agregar pago manual</button>}</header>
    <div className="ledger-toolbar"><label className="ledger-search"><Search size={18}/><input aria-label={tab==="teachers"?"Buscar profesor o curso":"Buscar ingresos"} placeholder={tab==="teachers"?"Buscar profesor o curso":"Buscar alumno, curso u origen"} value={query} onChange={e=>{setQuery(e.target.value);setLimit(PAGE);}}/></label>
      {tab==="income"?<select aria-label="Filtrar por curso" value={courseFilter} onChange={e=>{setCourseFilter(e.target.value);setLimit(PAGE);}}><option value="">Todos los cursos y conceptos</option>{data.courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>:<small>{filtered.length} profesores</small>}</div>
    {tab==="teachers"?<><div className="teacher-pay-grid">{filtered.slice(0,limit).map(t=><button key={t.name} className="teacher-pay-card" onClick={()=>{setSelected(t.name);setMarkError("");}}>
      <span className="pay-card-top"><span className="pay-avatar" aria-hidden="true">{t.name.trim().split(/\s+/).map(n=>n[0]).slice(0,2).join("")}</span><strong>{t.name}</strong></span>
      <span className="pay-course-line"><BookOpen size={15}/>{t.assigned.length} {t.assigned.length===1?"curso asignado":"cursos asignados"}</span>
      <span className="pay-course-names">{t.assigned.slice(0,2).map(a=>a.course.name).join(" · ")}{t.assigned.length>2?" y "+(t.assigned.length-2)+" más":""}</span>
      <span className="pay-card-bottom"><small>{t.complete?"Honorario ajustado":"Honorarios por configurar"}</small><b>{currency(t.net)}</b></span>
    </button>)}</div>{!filtered.length&&<p>No se encontraron profesores.</p>}</>:<>
      <div className="income-summary"><div><small>{courseFilter?"Cobrado en el curso":"Total de ingresos"}{query?" · búsqueda actual":""}</small><strong>{currency(matches.reduce((n,r)=>n+r.cents,0))}</strong></div>
        {filteredCourse&&<><div><small>Honorarios ajustados del curso</small><strong>{currency(payForCourse.reduce((n,a)=>n+a.net,0))}</strong></div><div><small>Saldo del curso{payForCourse.some(a=>!a.contract)?" · provisional":""}</small><strong>{currency(income.filter(r=>r.courseId===courseFilter).reduce((n,r)=>n+r.cents,0)-payForCourse.reduce((n,a)=>n+a.net,0))}</strong></div></>}</div>
      <div className="ledger-movements">{matches.length?<table><thead><tr><th>Alumno o concepto</th><th>Curso</th><th>Fecha</th><th>Origen</th><th>Importe</th></tr></thead><tbody>{matches.slice(0,limit).map(r=><tr key={r.source+":"+r.id}><td>{r.student}</td><td>{data.courses.find(c=>c.id===r.courseId)?.name||r.concept}</td><td>{r.date}</td><td><span className="ledger-chip">{r.source}</span></td><td><b>{currency(r.cents)}</b></td></tr>)}</tbody></table>:<p>Todavía no hay cobros que coincidan con esta selección.</p>}</div>
    </>}
    {(tab==="teachers"?filtered:matches).length>limit && <button className="admin-secondary-button" onClick={()=>setLimit(n=>n+PAGE)}>Ver más</button>}
    </>}
    {teacher && <Modal className="admin-form-modal ledger-detail" labelledBy="teacher-pay-title" onDismiss={()=>setSelected("")}><div className="sheet-heading"><div><h2 id="teacher-pay-title">{teacher.name}</h2><p>Detalle de honorarios y asistencia</p></div><button className="admin-icon-button" aria-label="Cerrar" onClick={()=>setSelected("")}><X size={18}/></button></div>
      <div className="income-summary"><div><small>Acordado</small><strong>{currency(teacher.assigned.reduce((s,a)=>s+a.amount,0))}</strong></div><div><small>Descuentos</small><strong>{currency(teacher.assigned.reduce((s,a)=>s+a.discount,0))}</strong></div><div><small>Honorario ajustado</small><strong>{currency(teacher.net)}</strong></div></div>
      <p>El honorario del curso se divide entre sus clases asignadas. Cada falta confirmada descuenta el importe de esa sesión.</p>
      {markError&&<p role="alert">{markError}</p>}
      {teacher.assigned.map(a=><details key={a.course.id} className="pay-course-detail" open={teacher.assigned.length===1||undefined}><summary><span><b>{a.course.name}</b><small>{a.contract?.role||"Honorarios por configurar"} · {a.entries.length} clases</small></span><strong>{currency(a.net)}</strong></summary>
        {a.entries.map(s=><div className="attendance-line" key={s.id}><span><b>{dateLabel(s.startsAt)}</b><small>{s.title}</small></span><span>{s.state==="missed"?"−":""}{currency(s.share)}</span>
        {s.state==="future"?<small>Programada</small>:<select aria-label={"Asistencia de "+teacher.name+" el "+dateLabel(s.startsAt)} disabled={busy||error} value={s.state} onChange={async e=>{const state=e.target.value as "taught"|"missed"|"pending";const ok=await mark({courseId:a.course.id,teacher:teacher.name,lessonId:s.id,startsAt:s.startsAt,state},state);setMarkError(ok?"":"La asistencia no se guardó. Comprueba los datos de la clase e inténtalo nuevamente.");}}><option value="pending">Por verificar</option><option value="taught">Dictó la clase</option><option value="missed">No la dictó</option></select>}</div>)}
        {!a.entries.length&&<p>Este curso aún no tiene clases programadas para el profesor.</p>}</details>)}
      {!teacher.assigned.length&&<p>Este profesor aún no tiene cursos asignados.</p>}</Modal>}
    {adding&&<ManualReceipt courses={data.courses} busy={busy} save={save} close={()=>setAdding(false)}/>}
  </section>;
}
function ManualReceipt({courses,busy,save,close}:{courses:Course[];busy:boolean;save:Props["save"];close:()=>void}){
  const [id,setId]=useState(""),[student,setStudent]=useState(""),[amount,setAmount]=useState(""),[error,setError]=useState("");
  async function submit(e:FormEvent){
    e.preventDefault();
    if(!id||!student.trim())return;
    if(await save({id:crypto.randomUUID(),courseId:id,student:student.trim(),cents:Math.round(Number(amount)*100),date:new Date().toLocaleDateString("sv-SE",{timeZone:"America/Lima"})}))close();
    else setError("No se registró el pago. Revisa los datos antes de volver a guardar.");
  }
  return <Modal className="admin-form-modal" labelledBy="receipt-title" onDismiss={close}><div className="sheet-heading"><h2 id="receipt-title">Agregar pago manual</h2><button className="admin-icon-button" aria-label="Cerrar" onClick={close}><X size={18}/></button></div>
  <form onSubmit={submit}><label className="admin-form-label">Curso<select required value={id} onChange={e=>{setId(e.target.value);setStudent("");}}><option value="">Elige un curso</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label className="admin-form-label">Alumno o concepto<input required list="pay-names" value={student} onChange={e=>setStudent(e.target.value)}/></label><datalist id="pay-names">{courses.find(c=>c.id===id)?.students.map(n=><option key={n}>{n}</option>)}</datalist>
  <label className="admin-form-label">Importe recibido (S/)<input type="number" min=".01" max="99999999.99" step=".01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label>
  {error&&<p role="alert">{error}</p>}<div className="admin-modal-actions"><button type="button" className="admin-secondary-button" onClick={close}>Cancelar</button><button disabled={busy} className="admin-primary-button"><Banknote size={16}/>Registrar pago</button></div></form></Modal>;
}
