"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Enrollment, Offer } from "@/lib/enrollment-types";
import "../registro/enrollment.css";

type Course = { id:string; name:string; level:string; slots:string[]; ends:string };
export default function EnrollmentPanel({ courses }: { courses?:Course[] }) {
  const managing = courses !== undefined;
  const [offers,setOffers] = useState<Offer[]>([]);
  const [requests,setRequests] = useState<Enrollment[]>([]);
  const [ready,setReady] = useState(false);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const [courseId,setCourseId] = useState("");
  const [venue,setVenue] = useState("");
  const [schedule,setSchedule] = useState("");
  const selected = courses?.find(c=>c.id===courseId);
  const refresh = useCallback(async (signal?:AbortSignal) => {
    try {
      const response = await fetch("/api/academy/enrollment"+(managing?"?view=offers":""),{cache:"no-store",signal});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (managing) setOffers(data.offers); else setRequests(data.requests);
      setError("");
    } catch(e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : "No se pudieron cargar los datos."); }
    finally { if(!signal?.aborted) setReady(true); }
  },[managing]);
  useEffect(()=>{
    const controller = new AbortController();
    const update = () => { if (!document.hidden) void refresh(controller.signal); };
    update();
    window.addEventListener("focus",update);
    return ()=>{controller.abort();window.removeEventListener("focus",update);};
  },[refresh]);
  async function change(id?:string) {
    setBusy(true);setError("");
    try {
      const response = await fetch("/api/academy/enrollment"+(id?"?id="+encodeURIComponent(id):""),id ? {method:"DELETE"} : {
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({venue,level:selected?.level,schedule})});
      if (!response.ok) throw new Error((await response.json()).error);
      await refresh();
    } catch(e) {setError(e instanceof Error ? e.message : "No se pudo guardar.");}
    finally {setBusy(false);}
  }
  function publish(e:FormEvent) {e.preventDefault();if(selected?.slots.includes(schedule)) void change();}
  return <section className="admin-panel-card enroll-admin"><details open={!managing}>
    <summary>{managing?"Horarios abiertos para matrícula":"Solicitudes de matrícula"} {ready && !error && `(${managing?offers.length:requests.length})`}</summary>
    {error && <p role="alert">{error}</p>}
    {!ready ? <div className="enroll-skeleton skeleton"/> : managing ? <>
      <p>Publica los turnos que admitirán solicitudes desde la web de tu academia.</p>
      <form className="offer-editor" onSubmit={publish}>
        <label>Curso<select value={courseId} required onChange={e=>{setCourseId(e.target.value);setSchedule("");}}>
          <option value="">Selecciona un curso</option>{courses.map(c=><option value={c.id} key={c.id}>{c.name} · {c.level}</option>)}</select></label>
        <label>Horario<select value={schedule} required disabled={!selected} onChange={e=>setSchedule(e.target.value)}>
          <option value="">Selecciona un horario</option>{selected?.slots.map(s=><option key={s}>{s}</option>)}</select></label>
        <label>Sede<input list="enroll-venues" value={venue} onChange={e=>setVenue(e.target.value)} maxLength={120} required placeholder="Nombre de la sede"/></label>
        <datalist id="enroll-venues">{[...new Set(offers.map(o=>o.venue))].map(v=><option key={v} value={v}/>)}</datalist>
        <button className="admin-primary-button" disabled={busy || !schedule || !venue.trim()}>Publicar horario</button>
      </form>
      {offers.length>0 && <div className="admin-table-wrap"><table><thead><tr><th>Sede</th><th>Nivel</th><th>Horario publicado</th><th></th></tr></thead>
        <tbody>{offers.map(o=><tr key={o.id}><td>{o.venue}</td><td>{o.level}</td><td>{o.schedule}</td><td><button className="admin-plain-link" disabled={busy} onClick={()=>change(o.id)}>Retirar</button></td></tr>)}</tbody></table></div>}
    </> : <>
      <button className="admin-plain-link" onClick={()=>refresh()}>Actualizar solicitudes</button>
      {!requests.length && !error ? <p>Todavía no se han recibido solicitudes.</p> : requests.length>0 && <div className="admin-table-wrap"><table><thead>
        <tr><th>Solicitante</th><th>Nacimiento</th><th>Contacto</th><th>Sede</th><th>Nivel y horario</th></tr></thead>
        <tbody>{requests.map(r=><tr key={r.id}><td><strong>{r.firstName} {r.lastName}</strong><small>DNI {r.dni}</small></td><td>{r.birthDate.split("-").reverse().join("/")}</td>
          <td>{r.email}<small>{r.phone}</small></td><td>{r.venue}</td><td>{r.level}<small>{r.schedule}</small></td></tr>)}</tbody></table></div>}
    </>}
  </details></section>;
}
