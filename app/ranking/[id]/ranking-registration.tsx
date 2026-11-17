"use client";

import { FormEvent, useEffect, useState } from "react";
import { Activity, CalendarDays, CheckCircle2, Clock3, MapPin, Trophy, Users } from "lucide-react";

type Participant = { id: string; name: string; kind: "Alumno" | "Externo"; paid: boolean; weight: number; group?: number };
type Ranking = { id: string; title: string; date: string; time: string; venue: string; studentPrice: number; publicPrice: number; capacity: number; participants: Participant[] };
const STORE_KEY = "ttacademias:rankings";

export default function RankingRegistration({ rankingId }: { rankingId: string }) {
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"Alumno" | "Externo">("Alumno");
  const [step, setStep] = useState<"form" | "payment" | "done">("form");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORE_KEY) || "[]") as Ranking[];
      setRanking(stored.find((entry) => entry.id === rankingId) || null);
    } catch { setRanking(null); }
    setLoading(false);
  }, [rankingId]);
  const price = ranking ? kind === "Alumno" ? ranking.studentPrice : ranking.publicPrice : 0;
  const remaining = ranking ? Math.max(0, ranking.capacity - ranking.participants.length) : 0;
  function continueToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ranking || !name.trim()) return;
    if (ranking.participants.length >= ranking.capacity) { setNotice("El ranking ya completó su aforo."); return; }
    if (ranking.participants.some((person) => person.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase())) { setNotice("Este nombre ya aparece inscrito."); return; }
    setNotice(""); setStep("payment");
  }
  function completeDemoPayment() {
    if (!ranking) return;
    const next: Ranking = { ...ranking, participants: [...ranking.participants, { id: `participant-${Date.now()}`, name: name.trim(), kind, paid: true, weight: 5 }] };
    const all = JSON.parse(window.localStorage.getItem(STORE_KEY) || "[]") as Ranking[];
    const updated = all.map((entry) => entry.id === ranking.id ? next : entry);
    window.localStorage.setItem(STORE_KEY, JSON.stringify(updated));
    setRanking(next); setStep("done");
  }
  if (loading) return <main className="ranking-public-page"><div className="ranking-public-loading">Cargando ranking…</div></main>;
  if (!ranking) return <main className="ranking-public-page"><section className="ranking-public-card ranking-public-unavailable"><span className="ranking-public-mark"><Trophy size={20} /></span><h1>Ranking no disponible</h1><p>El enlace puede haber vencido o el ranking todavía no está publicado.</p></section></main>;
  return <main className="ranking-public-page"><header className="ranking-public-header"><span className="ranking-public-mark"><Activity size={19} /></span><strong>SpinAcademy</strong><span className="ranking-public-header-tag">Inscripciones</span></header><section className="ranking-public-shell">
    <div className="ranking-public-intro"><span className="ranking-public-eyebrow"><Trophy size={14} /> RANKING DE LA ACADEMIA</span><h1>{ranking.title}</h1><p>Compite, suma puntos y comparte una jornada de tenis de mesa.</p><div className="ranking-public-facts"><span><CalendarDays size={16} />{new Date(`${ranking.date}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><span><Clock3 size={16} />{ranking.time}</span><span><MapPin size={16} />{ranking.venue}</span></div><div className="ranking-public-capacity"><div><span><Users size={15} /> Cupos disponibles</span><strong>{remaining} / {ranking.capacity}</strong></div><i><b style={{ width: `${Math.min(100, ranking.participants.length / ranking.capacity * 100)}%` }} /></i></div></div>
    <div className="ranking-public-form-wrap">{step === "done" ? <div className="ranking-public-success"><span><CheckCircle2 size={25} /></span><h2>¡Inscripción confirmada!</h2><p>{name.trim()}, tu pago de <strong>S/. {price.toFixed(2)}</strong> quedó registrado en esta demostración.</p><small>La academia ya puede verte en la lista de participantes.</small></div> : step === "payment" ? <div className="ranking-public-payment"><span className="ranking-public-eyebrow">PASO 2 DE 2</span><h2>Confirma tu inscripción</h2><p>Revisa la tarifa y completa el pago para reservar tu cupo.</p><div className="ranking-public-receipt"><span>{name.trim()} <small>{kind}</small></span><strong>S/. {price.toFixed(2)}</strong><small>Inscripción a {ranking.title}</small></div><div className="ranking-demo-payment-note">Demostración local: no se realizará un cobro real.</div><button className="ranking-public-primary" onClick={completeDemoPayment}>Pagar y confirmar inscripción</button><button className="ranking-public-back" onClick={() => setStep("form")}>Volver a mis datos</button></div> : <form className="ranking-public-form" onSubmit={continueToPayment}><span className="ranking-public-eyebrow">PASO 1 DE 2</span><h2>Inscríbete al ranking</h2><p>Completa tus datos. Tu cupo se confirma al pagar.</p>{notice && <div className="ranking-public-alert">{notice}</div>}<label>Nombre y apellido<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Mateo Gonzales" /></label><label>Tipo de participante<select value={kind} onChange={(event) => setKind(event.target.value as "Alumno" | "Externo")}><option value="Alumno">Alumno de la academia</option><option value="Externo">Participante externo</option></select></label><div className="ranking-public-price"><span>Tarifa {kind === "Alumno" ? "alumno" : "externo"}</span><strong>S/. {price.toFixed(2)}</strong></div><button className="ranking-public-primary" disabled={remaining === 0}>Continuar al pago</button><small className="ranking-public-remaining">{remaining === 0 ? "Aforo completo" : `Quedan ${remaining} cupos disponibles`}</small></form>}</div>
    <footer className="ranking-public-footer">Inscripción sujeta a cupos disponibles · Pago de demostración</footer>
  </section></main>;
}
