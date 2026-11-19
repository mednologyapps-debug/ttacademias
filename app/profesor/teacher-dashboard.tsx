"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CheckCircle2, Clock3, History, LogOut, Users, X, UserRound } from "lucide-react";
import MemberWorkspace from "@/components/member-workspace";
import Modal from "@/components/modal";
import RouteSkeleton from "@/components/route-skeleton";

type Student = { id: string; name: string; response: string | null };
type ClassItem = { id: string; title: string; courseName: string; startsAt: string; status: string; students: Student[] };
const slotOptions = ["08:00","10:00","12:00","14:00","16:00","18:00","20:00"];
const dateLabel = (date: string) => new Date(date).toLocaleString("es-PE", { weekday:"long", day:"numeric", month:"long", year:"numeric", hour:"numeric", minute:"2-digit" });
export default function TeacherDashboard() {
  const [classes,setClasses]=useState<ClassItem[]>([]); const [history,setHistory]=useState<ClassItem[]>([]); const [error,setError]=useState(""); const [busy,setBusy]=useState(""); const [loading,setLoading]=useState(true); const [view,setView]=useState<"upcoming"|"history">("upcoming"); const [reschedule,setReschedule]=useState<ClassItem|null>(null); const [date,setDate]=useState(""); const [time,setTime]=useState("18:00");  const [now,setNow]=useState(Date.now());
  const [academy, setAcademy] = useState({ name: "Lawntennis Club", logo: "" });
  useEffect(() => {
    fetch("/api/public/academy").then(response => response.json()).then(({ academy }) => {
      if (academy?.name) setAcademy({ name: academy.name, logo: academy.logoUrl || "" });
    }).catch(() => undefined);
  }, []);
  async function load(){setLoading(true);try{const r=await fetch("/api/teacher/classes");const d=await r.json();if(!r.ok)setError(d.error||"No se pudo cargar la agenda");else{setClasses(d.classes||[]);setHistory(d.history||[]);setError("")}}catch{setError("No se pudo cargar la agenda.")}finally{setLoading(false)}}
  useEffect(()=>{void load()},[]);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),30000);return()=>window.clearInterval(timer)},[]);
  const conflict=useMemo(()=>{if(!reschedule||!date)return false;const proposed=new Date(`${date}T${time}:00`).getTime();return [...classes,...history].some(c=>c.id!==reschedule.id&&Math.abs(new Date(c.startsAt).getTime()-proposed)<120*60*1000)},[reschedule,date,time,classes,history]);
  async function update(item:ClassItem, payload:Record<string,string>){setBusy(item.id);setError("");try{const r=await fetch(`/api/teacher/classes/${item.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok){setError(d.error||"No se pudo guardar el cambio.");return}if(payload.action==="attendance"){const apply=(list:ClassItem[])=>list.map(c=>c.id===item.id?{...c,students:c.students.map(s=>s.id===payload.studentId?{...s,response:payload.response}:s)}:c);setClasses(apply);setHistory(apply)}else if(payload.action==="accept"){setClasses(prev=>prev.map(c=>c.id===item.id?{...c,status:"accepted"}:c))}else if(payload.action==="reschedule"&&d.startsAt){setClasses(prev=>prev.map(c=>c.id===item.id?{...c,startsAt:d.startsAt,status:"rescheduled"}:c));setReschedule(null)}}catch{setError("No se pudo guardar el cambio.")}finally{setBusy("")}}
  async function logout(){const response = await fetch("/api/auth/logout", {method:"POST"}).catch(() => null); if (response?.ok) location.replace("/login"); else setError("No se pudo cerrar la sesión. Inténtalo de nuevo.")}
  if(loading)return <RouteSkeleton kind="admin"/>;
  const active=view==="upcoming"?classes:history;
  return <MemberWorkspace academy={academy.name} logo={academy.logo} roleLabel="Profesor" active={view}
    destinations={[
      { label: "Mis clases", key: "upcoming", icon: CalendarDays },
      { label: "Historial", key: "history", icon: History },
    ]}
    onSelect={setView} onLogout={() => void logout()}
    headerAction={<button className="member-header-button" onClick={() => void logout()}><LogOut size={17} /> Salir</button>}>
    <section className="teacher-work">
      <header className="teacher-page-heading">
        <h1>{view === "upcoming" ? "Mis clases" : "Historial de cursos"}</h1>
        <p>{active.length} {active.length === 1 ? "sesión" : "sesiones"} · {active.reduce((count, item) => count + item.students.length, 0)} participaciones</p>
      </header>
      {error&&<div className="teacher-error" role="alert">{error}</div>}
      {!active.length?<div className="teacher-empty"><CalendarDays size={28}/><strong>{view==="upcoming"?"No hay clases próximas":"Aún no hay clases en el historial"}</strong><span>Las sesiones aparecerán aquí cuando estén asignadas.</span></div>:<div className="teacher-class-grid">{active.map(item=><article className="teacher-class-card" key={item.id}><div className="teacher-session-info"><div className="teacher-class-top"><span className="course-chip">{item.courseName}</span><span className={`teacher-class-state ${item.status}`}>{item.status==="accepted"?"Clase confirmada":item.status==="rescheduled"?"Reprogramada":item.status==="completed"?"Finalizada":"Pendiente"}</span></div><h2>{item.title}</h2><div className="teacher-class-date"><CalendarDays size={17}/>{dateLabel(item.startsAt)}<span>2 h</span></div>
        {view==="upcoming"&&<div className="teacher-actions">{item.status==="accepted"?<button className="teacher-confirmed" disabled><CheckCircle2 size={17}/> Clase confirmada</button>:<><button className="teacher-accept" disabled={busy===item.id} onClick={()=>void update(item,{action:"accept"})}><CheckCircle2 size={17}/>{busy===item.id?"Guardando…":"Aceptar clase"}</button><button className="teacher-reschedule-trigger" onClick={()=>{const d=new Date(item.startsAt);setDate(d.toISOString().slice(0,10));setTime(`${String(d.getHours()).padStart(2,"0")}:00`);setReschedule(item)}}><Clock3 size={17}/>Proponer reprogramación</button></>}</div>}
        </div><div className="teacher-roll"><div className="teacher-students-heading"><div><Users size={17}/><strong>Participantes</strong><span>{item.students.length}</span></div>{view==="history"&&<small>Registro de asistencia</small>}</div>{item.students.map(student=><div className="teacher-student-row" key={student.id}><span className="teacher-student-avatar"><UserRound size={15}/></span><strong>{student.name}</strong>{view==="history"?<span className={`attendance-result ${student.response||"pending"}`}>{student.response==="present"?"Presente":student.response==="absent"?"Ausente":student.response==="yes"?"Confirmó":"Sin registro"}</span>:new Date(item.startsAt).getTime()>now?<span className="attendance-locked"><Clock3 size={13}/>Desde {new Date(item.startsAt).toLocaleTimeString("es-PE",{hour:"numeric",minute:"2-digit"})}</span>:<div className="attendance-choice" aria-label={`Asistencia de ${student.name}`}><button className={student.response==="present"?"selected present":""} disabled={busy===item.id} onClick={()=>void update(item,{action:"attendance",studentId:student.id,response:"present"})}><Check size={13}/>Presente</button><button className={student.response==="absent"?"selected absent":""} disabled={busy===item.id} onClick={()=>void update(item,{action:"attendance",studentId:student.id,response:"absent"})}><X size={13}/>Ausente</button></div>}</div>)}</div></article>)}</div>}
    </section>
    {reschedule && <Modal className="teacher-reschedule-modal" labelledBy="reschedule-title" notice={error} onDismiss={() => setReschedule(null)}><header><div><span>CAMBIO DE HORARIO</span><h2 id="reschedule-title">Proponer reprogramación</h2><p>Elige una fecha y un bloque de 2 horas disponible.</p></div><button onClick={()=>setReschedule(null)} aria-label="Cerrar"><X/></button></header><div className="reschedule-class-summary"><small>CLASE ACTUAL</small><strong>{reschedule.title}</strong><span>{dateLabel(reschedule.startsAt)}</span></div><div className="reschedule-fields"><label>Fecha<input type="date" min={new Date().toISOString().slice(0,10)} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Hora de inicio<select value={time} onChange={e=>setTime(e.target.value)}>{slotOptions.map(s=><option key={s} value={s}>{new Date(`2000-01-01T${s}:00`).toLocaleTimeString("es-PE",{hour:"numeric",minute:"2-digit"})} – 2 horas</option>)}</select></label></div><div className={`reschedule-validation ${conflict?"conflict":"available"}`}>{conflict?<><X size={17}/> Este horario se cruza con otra clase. Selecciona otro bloque.</>:<><CheckCircle2 size={17}/> {date?"Horario disponible. La academia verificará nuevamente antes de guardar.":"Selecciona una fecha futura y verifica su disponibilidad."}</>}</div><footer><button onClick={()=>setReschedule(null)}>Cancelar</button><button className="teacher-accept" disabled={!date||conflict||busy===reschedule.id} onClick={()=>void update(reschedule,{action:"reschedule",startsAt:new Date(`${date}T${time}:00`).toISOString()})}>{busy===reschedule.id?"Verificando…":"Confirmar horario"}</button></footer></Modal>}
  </MemberWorkspace>;
}
