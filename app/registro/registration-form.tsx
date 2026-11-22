"use client";

import InquiryForm from "./inquiry-form";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { enrollmentLevels, type Applicant, type Offer } from "@/lib/enrollment-types";
import "./enrollment.css";

const blank: Applicant = { firstName:"",lastName:"",dni:"",email:"",phone:"",birthDate:"" };

export default function RegistrationForm({ embedded = false }: { embedded?: boolean }) {
  const [step,setStep] = useState(1);
  const [person,setPerson] = useState(blank);
  const [options,setOptions] = useState<Offer[]>([]);
  const [venue,setVenue] = useState("");
  const [level,setLevel] = useState("");
  const [slot,setSlot] = useState("");
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    if (step === 3) return;
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/public/enrollment",{signal:controller.signal,cache:"no-store"}).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const items: Offer[] = data.offers;
      setOptions(items);
      const venues = [...new Set(items.map(item => item.venue))];
      setVenue(old => venues.length === 1 ? venues[0] : venues.includes(old) ? old : "");
    }).catch(e => { if (!controller.signal.aborted) { setOptions([]); setMessage(e.message || "No se pudieron consultar los horarios."); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  },[step,attempt]);
  const venues = [...new Set(options.map(o => o.venue))];
  const available = options.filter(o => o.venue === venue);
  const slots = available.filter(o => o.level === level);
  function field(key: keyof Applicant) {
    return { id:"enroll-"+key, name:key, value:person[key], required:true,
      onChange:(e:React.ChangeEvent<HTMLInputElement>) => setPerson({...person,[key]:e.target.value}) };
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (step === 1) { setStep(2); return; }
    if (!slots.some(o => o.id === slot) || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/public/enrollment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...person,offerId:slot})});
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) { setSlot(""); setLevel(""); setAttempt(n=>n+1); }
        throw new Error(data.error);
      }
      setStep(3);
    } catch(e) { setMessage(e instanceof Error ? e.message : "No se pudo enviar tu solicitud."); }
    finally { setBusy(false); }
  }
  const panel = loading && step===1 ? <section className="enroll-form" role="status">Consultando horarios…</section> : !loading && !options.length && !message ? <InquiryForm/> : !loading && !options.length ? <section className="enroll-form"><p role="alert">{message}</p><button className="enroll-back" onClick={()=>{setMessage("");setLoading(true);setAttempt(n=>n+1);}}>Volver a consultar</button></section> : <section className="enroll-form">
    {step === 3 ? <div role="status"><h2>Solicitud recibida</h2><p>La administración de tu academia ya puede revisar tus datos y tu horario elegido.</p>
      <p><strong>{level}</strong> · {slots.find(o=>o.id===slot)?.schedule} · {venue}</p></div> : <>
    <h2>Matricularme</h2><p aria-live="polite">{step === 1 ? "1 de 2 · Datos personales" : "2 de 2 · Elige dónde y cuándo entrenar"}</p>
    <form onSubmit={submit}>
      {step === 1 ? <div className="enroll-fields">
        <label>Nombres<input {...field("firstName")} autoComplete="given-name" maxLength={100} pattern=".*\S.*" /></label>
        <label>Apellidos<input {...field("lastName")} autoComplete="family-name" maxLength={100} pattern=".*\S.*" /></label>
        <label>DNI<input {...field("dni")} inputMode="numeric" pattern="[0-9]{8}" maxLength={8} placeholder="8 dígitos" /></label>
        <label>Fecha de nacimiento<input {...field("birthDate")} type="date" min="1900-01-01" max={new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Lima"}).format(new Date())} autoComplete="bday" /></label>
        <label>Correo electrónico<input {...field("email")} type="email" autoComplete="email" maxLength={254} /></label>
        <label>Celular<input {...field("phone")} type="tel" autoComplete="tel" maxLength={30} placeholder="987 654 321"
          onInput={e => e.currentTarget.setCustomValidity(/^\+?[0-9 ()-]+$/.test(e.currentTarget.value) && /^\d{7,15}$/.test(e.currentTarget.value.replace(/\D/g,"")) ? "" : "Ingresa un celular válido.")}/></label>
      </div> : loading ? <div className="enroll-skeleton skeleton" aria-label="Consultando horarios" /> : options.length ? <div className="enroll-choices">
        {venues.length > 1 ? <label>Sede<select required value={venue} onChange={e=>{setVenue(e.target.value);setLevel("");setSlot("");}}>
          <option value="">Elige una sede</option>{venues.map(v=><option key={v}>{v}</option>)}</select></label> : <p>Sede · <strong>{venue}</strong></p>}
        <label>Nivel<select required value={level} disabled={!venue} onChange={e=>{setLevel(e.target.value);setSlot("");}}>
          <option value="">Elige tu nivel</option>{enrollmentLevels.filter(l=>available.some(o=>o.level===l)).map(l=><option key={l}>{l}</option>)}</select></label>
        <label>Horario<select required value={slot} disabled={!level} onChange={e=>setSlot(e.target.value)}>
          <option value="">Elige un horario</option>{slots.map(o=><option key={o.id} value={o.id}>{o.schedule}</option>)}</select></label>
      </div> : <>{!message && <p>La academia aún no ha publicado horarios de matrícula.</p>}
        <button type="button" className="enroll-back" onClick={()=>{setMessage("");setAttempt(n=>n+1);}}>Volver a consultar</button></>}
      {message && <p role="alert">{message}</p>}
      <div className="enroll-actions">{step === 2 && <button type="button" className="enroll-back" disabled={busy} onClick={()=>{setMessage("");setStep(1);}}>Atrás</button>}
        <button className="club-action" disabled={busy || (step === 2 && (loading || !slots.some(o=>o.id===slot)))}>{step === 1 ? "Siguiente" : busy ? "Enviando…" : "Enviar solicitud"}</button></div>
    </form></>}
  </section>;
  return embedded ? panel : <main className="enroll-page"><Link href="/">Volver a la academia</Link>{panel}</main>;
}
