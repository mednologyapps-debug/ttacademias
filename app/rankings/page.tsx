"use client";
import {useStandings,StandingsTable,PublishedGroups} from "@/components/academy-standings";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CalendarDays, MapPin, Trophy, Users } from "lucide-react";

type Ranking = { id: string; title: string; date: string; time: string; venue: string; studentPrice: number; publicPrice: number; capacity: number; participants: { paid: boolean }[] };
export default function RankingsPage() {
  const {result,error}=useStandings(true);
  const [items, setItems] = useState<Ranking[]>([]);
  const [ready, setReady] = useState(false);
  const [academyName, setAcademyName] = useState("TT Academias");
  const [academyLogo, setAcademyLogo] = useState("");
  useEffect(() => {
    fetch("/api/public/academy").then((response) => response.json()).then((data) => { if (data.academy?.name) setAcademyName(data.academy.name); if (data.academy?.logoUrl) setAcademyLogo(data.academy.logoUrl); }).catch(() => undefined);
    try {
      const saved = JSON.parse(localStorage.getItem("ttacademias:rankings") || "[]") as Ranking[];
      setItems(Array.isArray(saved) ? saved.filter((item) => new Date(`${item.date}T23:59:59`).getTime() >= Date.now()) : []);
    } catch { setItems([]); }
    setReady(true);
  }, []);
  const open=items.filter(i=>!result?.started.includes(i.id));
  return <main className="ranking-directory"><header><Link href="/" className="ranking-directory-brand"><span>{academyLogo ? <img src={academyLogo} alt=""/> : <Activity size={19}/>}</span>{academyName}</Link><Link href="/login">Iniciar sesión</Link></header><section className="ranking-directory-content"><Link href="/" className="ranking-directory-back"><ArrowLeft size={15}/> Portal de la academia</Link><PublishedGroups events={result?.competitions}/><StandingsTable rows={result?.table} error={error}/><h1>Rankings activos</h1><p>Revisa la información y las tarifas antes de inscribirte.</p>{!ready ? <div className="ranking-directory-grid">{[0,1,2].map((item)=><div className="skeleton ranking-directory-skeleton" key={item}/>)}</div> : open.length ? <div className="ranking-directory-grid">{open.map((item)=><article className="ranking-directory-card" key={item.id}><div className="ranking-directory-icon"><Trophy size={20}/></div><span className="ranking-directory-status">Inscripción abierta</span><h2>{item.title}</h2><p><CalendarDays size={15}/>{new Date(`${item.date}T12:00:00`).toLocaleDateString("es-PE",{weekday:"long",day:"numeric",month:"long"})} · {item.time}</p><p><MapPin size={15}/>{item.venue}</p><div className="ranking-directory-capacity"><span><Users size={14}/> Participantes</span><strong>{item.participants.filter((person)=>person.paid).length} / {item.capacity}</strong></div><div className="ranking-directory-prices"><span>Alumno <b>S/. {item.studentPrice.toFixed(2)}</b></span><span>Externo <b>S/. {item.publicPrice.toFixed(2)}</b></span></div><Link className="public-portal-primary" href={`/ranking/${encodeURIComponent(item.id)}`}>Inscribirme</Link></article>)}</div> : <div className="ranking-directory-empty"><span><Trophy size={22}/></span><h2>Pronto habrá nuevos rankings</h2><p>Cuando la academia publique una competencia, aparecerá aquí con sus fechas y cupos.</p><Link href="/registro">Asociarme a la academia</Link></div>}</section></main>;
}
