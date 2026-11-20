"use client";
import {useStandings} from "@/components/academy-standings";

import { FormEvent, useEffect, useState } from "react";
import { Activity, CalendarDays, CheckCircle2, Clock3, MapPin, Trophy, Users } from "lucide-react";

type Participant = { id: string; name: string; kind: "Alumno" | "Externo"; dni?: string; paid: boolean; weight: number; group?: number };
type Ranking = { id: string; title: string; date: string; time: string; venue: string; studentPrice: number; publicPrice: number; capacity: number; participants: Participant[] };
type AcademyStudent = { dni: string; name: string };
const STORE_KEY = "ttacademias:rankings";
const STUDENTS_KEY = "ttacademias:academy-students";
const DEMO_STUDENTS: AcademyStudent[] = [
  { dni: "10000001", name: "Mateo Gonzales" }, { dni: "10000002", name: "Vanessa Cárdenas" },
  { dni: "10000003", name: "Diego Vásquez" }, { dni: "10000004", name: "Nicole Torres" },
];

export default function RankingRegistration({ rankingId, embedded = false }: { rankingId: string; embedded?: boolean }) {
  const {result:board,error:boardError}=useStandings();
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [academyStudents, setAcademyStudents] = useState<AcademyStudent[]>(DEMO_STUDENTS);
  const [loading, setLoading] = useState(true);
  const [dni, setDni] = useState("");
  const [externalName, setExternalName] = useState("");
  const [pendingParticipantId, setPendingParticipantId] = useState("");
  const [invalidPaymentLink, setInvalidPaymentLink] = useState(false);
  const [step, setStep] = useState<"form" | "payment" | "done">("form");
  const [notice, setNotice] = useState("");
  const [academyName, setAcademyName] = useState("TT Academias");
  const [academyLogo, setAcademyLogo] = useState("");
  const matchedStudent = academyStudents.find((student) => student.dni === dni);
  const participantName = matchedStudent?.name || externalName.trim();
  const participantKind: "Alumno" | "Externo" = matchedStudent ? "Alumno" : "Externo";
  const price = ranking ? participantKind === "Alumno" ? ranking.studentPrice : ranking.publicPrice : 0;
  const remaining = ranking ? Math.max(0, ranking.capacity - ranking.participants.length) : 0;
  const pendingParticipant = ranking?.participants.find((participant) => participant.id === pendingParticipantId);

  useEffect(() => {
    if (!embedded) fetch("/api/public/academy").then((response) => response.json()).then((data) => { if (data.academy?.name) setAcademyName(data.academy.name); if (data.academy?.logoUrl) setAcademyLogo(data.academy.logoUrl); }).catch(() => undefined);
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORE_KEY) || "[]") as Ranking[];
      const current = stored.find((entry) => entry.id === rankingId) || null;
      setRanking(current);
      const students = JSON.parse(window.localStorage.getItem(STUDENTS_KEY) || "null") as AcademyStudent[] | null;
      if (Array.isArray(students)) setAcademyStudents(students);
      const requestedPayment = !embedded && new URLSearchParams(window.location.search).get("pay");
      if (requestedPayment) {
        const participant = current?.participants.find((entry) => entry.id === requestedPayment && !entry.paid);
        if (!participant) setInvalidPaymentLink(true);
        else {
          setPendingParticipantId(participant.id); setDni(participant.dni || ""); setExternalName(participant.kind === "Externo" ? participant.name : ""); setStep("payment");
        }
      }
    } catch { setRanking(null); }
    setLoading(false);
  }, [rankingId, embedded]);

  function continueToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ranking || !/^\d{8}$/.test(dni)) { setNotice("Ingresa un DNI válido de 8 dígitos."); return; }
    if (!matchedStudent && !externalName.trim()) { setNotice("Ingresa tu nombre y apellido para continuar."); return; }
    if (ranking.participants.length >= ranking.capacity) { setNotice("El ranking ya completó su aforo."); return; }
    const existing = ranking.participants.find((participant) => participant.dni === dni);
    if (existing?.paid) { setNotice("Este DNI ya tiene una inscripción pagada."); return; }
    if (existing && !existing.paid) setPendingParticipantId(existing.id);
    setNotice(""); setStep("payment");
  }

  async function completeDemoPayment() {
    try {
      const response=await fetch("/api/public/standings",{cache:"no-store"});
      if(!response.ok) throw Error();
      if((await response.json()).started.includes(rankingId)){setRanking(null);return;}
    }catch{setNotice("No se pudo verificar si las inscripciones siguen abiertas.");return;}

    if (!ranking) return;
    const enrolledName = pendingParticipant?.name || participantName;
    const enrolledKind = pendingParticipant?.kind || participantKind;
    const enrolledDni = pendingParticipant?.dni || dni;
    if (!enrolledName || !/^\d{8}$/.test(enrolledDni)) { setNotice("No pudimos validar los datos de inscripción."); return; }
    let next: Ranking;
    if (pendingParticipantId) {
      next = { ...ranking, participants: ranking.participants.map((participant) => participant.id === pendingParticipantId ? { ...participant, paid: true } : participant) };
    } else {
      if (ranking.participants.length >= ranking.capacity || ranking.participants.some((participant) => participant.dni === enrolledDni && participant.paid)) { setNotice("El cupo ya no está disponible o el DNI ya está inscrito."); return; }
      next = { ...ranking, participants: [...ranking.participants, { id: `participant-${Date.now()}`, name: enrolledName, kind: enrolledKind, dni: enrolledDni, paid: true, weight: 5 }] };
    }
    const all = JSON.parse(window.localStorage.getItem(STORE_KEY) || "[]") as Ranking[];
    const updated = all.map((entry) => entry.id === ranking.id ? next : entry);
    window.localStorage.setItem(STORE_KEY, JSON.stringify(updated));
    setRanking(next); setStep("done");
  }

  const Page = embedded ? "div" : "main";
  const pageClass = embedded ? "embedded-ranking" : "ranking-public-page";
  if (loading || (!board && !boardError)) return <Page className={pageClass} aria-label="Cargando ranking"><div className="skeleton ranking-public-skeleton-header"/><div className="skeleton ranking-public-skeleton-card"/></Page>;
  if(boardError || board?.started.includes(rankingId)) return <Page className={pageClass}><section className="ranking-public-card"><h2>{boardError?"No se pudo verificar el ranking":"Inscripciones cerradas"}</h2><a href="/rankings">Ver tabla de la academia</a></section></Page>;
  if (!ranking) return <Page className={pageClass}><section className="ranking-public-card ranking-public-unavailable"><span className="ranking-public-mark"><Trophy size={20} /></span><h1>Ranking no disponible</h1><p>El enlace puede haber vencido o el ranking todavía no está publicado.</p></section></Page>;
  if (invalidPaymentLink) return <Page className={pageClass}><section className="ranking-public-card ranking-public-unavailable"><span className="ranking-public-mark"><Trophy size={20} /></span><h1>Enlace de pago no disponible</h1><p>Solicita a la academia que te envíe un nuevo enlace de pago.</p></section></Page>;
  const displayName = pendingParticipant?.name || participantName;
  const displayKind = pendingParticipant?.kind || participantKind;
  const displayPrice = ranking ? displayKind === "Alumno" ? ranking.studentPrice : ranking.publicPrice : 0;
  return <Page className={pageClass}>{!embedded && <header className="ranking-public-header"><span className="ranking-public-mark">{academyLogo ? <img src={academyLogo} alt=""/> : <Activity size={19} />}</span><strong>{academyName}</strong><span className="ranking-public-header-tag">Inscripciones</span></header>}<section className="ranking-public-shell">
    <div className="ranking-public-intro">{!embedded && <span className="ranking-public-eyebrow"><Trophy size={14} /> RANKING DE LA ACADEMIA</span>}<h1>{ranking.title}</h1><p>Compite, suma puntos y comparte una jornada de tenis de mesa.</p><div className="ranking-public-facts"><span><CalendarDays size={16} />{new Date(`${ranking.date}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><span><Clock3 size={16} />{ranking.time}</span><span><MapPin size={16} />{ranking.venue}</span></div><div className="ranking-public-capacity"><div><span><Users size={15} /> Cupos disponibles</span><strong>{remaining} / {ranking.capacity}</strong></div><i><b style={{ width: `${Math.min(100, ranking.participants.length / ranking.capacity * 100)}%` }} /></i></div></div>
    <div className="ranking-public-form-wrap">{step === "done" ? <div className="ranking-public-success"><span><CheckCircle2 size={25} /></span><h2>¡Inscripción confirmada!</h2><p>{displayName}, tu pago de <strong>S/. {displayPrice.toFixed(2)}</strong> quedó registrado en esta demostración.</p><small>La academia ya puede verte en la lista de participantes.</small></div> : step === "payment" ? <div className="ranking-public-payment"><span className="ranking-public-eyebrow">{pendingParticipantId ? "PAGO DE INSCRIPCIÓN" : "PASO 2 DE 2"}</span><h2>{pendingParticipantId ? "Completa tu pago" : "Confirma tu inscripción"}</h2><p>{pendingParticipantId ? "La academia registró tus datos. Solo falta pagar para confirmar tu cupo." : "Revisa tus datos y completa el pago para reservar tu cupo."}</p>{notice && <div className="ranking-public-alert">{notice}</div>}<div className="ranking-public-receipt"><span>{displayName || "Participante"} <small>{displayKind} · DNI {pendingParticipant?.dni || dni}</small></span><strong>S/. {displayPrice.toFixed(2)}</strong><small>Inscripción a {ranking.title}</small></div><div className="ranking-demo-payment-note">Demostración local: no se realizará un cobro real.</div><button className="ranking-public-primary" onClick={completeDemoPayment}>Pagar y confirmar inscripción</button>{!pendingParticipantId && <button className="ranking-public-back" onClick={() => setStep("form")}>Volver a mis datos</button>}</div> : <form className="ranking-public-form" onSubmit={continueToPayment}><span className="ranking-public-eyebrow">PASO 1 DE 2</span><h2>Inscríbete al ranking</h2><p>Ingresa tu DNI para validar automáticamente tu tarifa.</p>{notice && <div className="ranking-public-alert">{notice}</div>}<label>DNI<input required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" value={dni} onChange={(event) => { setDni(event.target.value.replace(/\D/g, "").slice(0, 8)); setExternalName(""); setNotice(""); }} placeholder="8 dígitos" /></label>{/^\d{8}$/.test(dni) && (matchedStudent ? <div className="ranking-dni-match public-match"><CheckCircle2 size={16} /><span><strong>{matchedStudent.name}</strong><small>Alumno reconocido · tarifa de academia</small></span></div> : <><label>Nombre y apellido<input required value={externalName} onChange={(event) => setExternalName(event.target.value)} placeholder="Ej. Carlos Ramos" /></label><div className="ranking-external-note">No encontramos este DNI en la academia. Se aplicará la tarifa para externos.</div></>)}<div className="ranking-public-price"><span>{matchedStudent ? "Tarifa alumno" : /^\d{8}$/.test(dni) ? "Tarifa externa" : "Ingresa tu DNI para ver la tarifa"}</span><strong>{/^\d{8}$/.test(dni) ? `S/. ${(matchedStudent ? ranking.studentPrice : ranking.publicPrice).toFixed(2)}` : "—"}</strong></div><button className="ranking-public-primary" disabled={remaining === 0 || !/^\d{8}$/.test(dni) || (!matchedStudent && !externalName.trim())}>Continuar al pago</button><small className="ranking-public-remaining">{remaining === 0 ? "Aforo completo" : `Quedan ${remaining} cupos disponibles`}</small></form>}</div>
    <footer className="ranking-public-footer">Inscripción sujeta a cupos disponibles · Pago de demostración</footer>
  </section></Page>;
}
