"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {Home,CalendarDays,Trophy,UserRound,LogOut} from "lucide-react";
import MemberWorkspace from "@/components/member-workspace";
import {PublishedGroups,StandingsTable,useStandings} from "@/components/academy-standings";

type Section="Inicio"|"Mis clases"|"Rankings"|"Mi perfil";
type Lesson={id:string;title:string;course:string;teacher:string;startsAt:string;response:string|null};
type Data={classes:Lesson[];courses:{name:string}[];announcements:string[][];payments:{id:string;purpose:string;amount:number;status:string}[];memberships:{name:string;ends:string}[];entries:{id:string;title:string;paid:boolean}[]};
const destinations=[{key:"Inicio",label:"Inicio",icon:Home},{key:"Mis clases",label:"Mis clases",icon:CalendarDays},{key:"Rankings",label:"Rankings",icon:Trophy},{key:"Mi perfil",label:"Mi perfil",icon:UserRound}] as const;
const date=(value:string)=>new Date(value).toLocaleString("es-PE",{timeZone:"America/Lima",dateStyle:"medium",timeStyle:"short"});

export default function StudentPortal({name,academy,email}:{name:string;academy:string;email:string}){
  const [tab,setTab]=useState<Section>("Inicio"),[data,setData]=useState<Data|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  const board=useStandings(true);
  const load=useCallback(async()=>{
    try{const res=await fetch("/api/student/portal",{cache:"no-store"});if(!res.ok)throw Error();setData(await res.json());setMessage("");}
    catch{setMessage("No se pudo cargar tu portal.");}
  },[]);
  useEffect(()=>{void load();window.addEventListener("focus",load);return()=>window.removeEventListener("focus",load);},[load]);
  async function reply(id:string,response:string){
    setBusy(true);try{
      const res=await fetch("/api/student/portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,response})});
      if(!res.ok)throw Error((await res.json()).error);await load();
    }catch(e){setMessage(e instanceof Error?e.message:"No se guardó la asistencia.");}finally{setBusy(false);}
  }
  async function logout(){const res=await fetch("/api/auth/logout",{method:"POST"});if(res.ok)location.replace("/login");else setMessage("No se pudo cerrar la sesión.");}
  const upcoming=data?.classes.filter(c=>Date.parse(c.startsAt)+7200000>Date.now())||[];
  const card=(c:Lesson)=><article className="teacher-class-card" key={c.id}><div className="teacher-session-info"><span className="course-chip">{c.course}</span><h2>{c.title}</h2><p>{date(c.startsAt)} · {c.teacher}</p>
    {new Date(c.startsAt).getTime()>Date.now()?<div className="teacher-actions"><button className="teacher-accept" disabled={busy||c.response==="yes"} onClick={()=>reply(c.id,"yes")}>{c.response==="yes"?"Asistencia confirmada":"Sí, asistiré"}</button><button className="teacher-reschedule-trigger" disabled={busy||c.response==="no"} onClick={()=>reply(c.id,"no")}>{c.response==="no"?"Ausencia comunicada":"No asistiré"}</button></div>:<p>{c.response==="present"?"Presente":c.response==="absent"?"Ausente":"Clase programada"}</p>}</div></article>;
  return <MemberWorkspace academy={academy} roleLabel="Alumno" active={tab} destinations={[...destinations]} onSelect={setTab} onLogout={logout}
    headerAction={<button className="member-header-button" onClick={logout}><LogOut size={16}/> Salir</button>}>
    <section className="teacher-work"><header className="teacher-page-heading"><h1>{tab==="Inicio"?"Hola, "+name:tab}</h1><p>{academy}</p></header>
    {message&&<p role="alert">{message} <button onClick={load}>Reintentar</button></p>}
    {!data&&!message&&<p>Cargando tu información…</p>}
    {tab==="Inicio"&&data&&<><div className="teacher-class-grid"><section className="teacher-class-card"><div className="teacher-session-info"><h2>Mis cursos</h2>{data.courses.length?data.courses.map((c,i)=><p key={i}>{c.name}</p>):<p>Aún no tienes cursos asignados.</p>}</div></section>
    <section className="teacher-class-card"><div className="teacher-session-info"><h2>Próxima clase</h2>{upcoming[0]?<><p>{upcoming[0].title} · {date(upcoming[0].startsAt)}</p><button className="admin-plain-link" onClick={()=>setTab("Mis clases")}>Ver mi agenda</button></>:<p>Todavía no tienes clases programadas.</p>}</div></section></div>
    {data.announcements.map(([title,body],i)=><section className="teacher-class-card" key={i}><div className="teacher-session-info"><h2>{title}</h2><p>{body}</p></div></section>)}<p><Link href="/rankings">Ver rankings e inscripciones</Link></p></>}
    {tab==="Mis clases"&&data&&<div className="teacher-class-grid">{data.classes.length?[...upcoming,...data.classes.filter(c=>!upcoming.includes(c)).reverse()].map(card):<p>La academia todavía no te ha asignado clases.</p>}</div>}
    {tab==="Rankings"&&<><section className="teacher-class-card"><div className="teacher-session-info"><h2>Mis inscripciones</h2>{data?.entries.map(e=><p key={e.id}>{e.title} · {e.paid?"Confirmada":"Pendiente de pago"}</p>)}{data&&!data.entries.length&&<p>Aún no tienes inscripciones.</p>}<Link className="public-portal-primary" href="/rankings">Ver rankings e inscribirme</Link></div></section><PublishedGroups events={board.result?.competitions}/><StandingsTable rows={board.result?.table} error={board.error}/></>}
    {tab==="Mi perfil"&&<section className="teacher-class-card"><div className="teacher-session-info"><h2>{name}</h2><p>{email}</p><h2>Membresías</h2>{data?.memberships.map((m,i)=><p key={i}>{m.name} · hasta {m.ends}</p>)}{data&&!data.memberships.length&&<p>Sin membresías registradas.</p>}<h2>Mis pagos</h2>{data?.payments.map(p=><p key={p.id}>{({membership:"Membresía",ranking:"Ranking",enrollment:"Matrícula"} as Record<string,string>)[p.purpose]||p.purpose} · S/ {Number(p.amount).toFixed(2)} · {p.status==="paid"?"Pagado":p.status==="pending"?"Pendiente":p.status}</p>)}{data&&!data.payments.length&&<p>Sin pagos registrados.</p>}</div></section>}
    </section></MemberWorkspace>;
}
