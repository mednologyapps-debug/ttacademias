"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/modal";
import RegistrationForm from "./registro/registration-form";
import RankingRegistration from "./ranking/[id]/ranking-registration";
import "./landing-editorial.css";
import { Activity, ArrowLeft, ArrowRight, CalendarDays, Menu, Trophy, X } from "lucide-react";

type Props = { academyName: string; logoUrl: string | null; primaryColor: string; ranking: { id: string; title: string; startsAt: string; venue: string; studentPrice: string; publicPrice: string; capacity: number } | null; teachers: string[] };
const slides = [
  { image: "https://images.unsplash.com/photo-1774755458463-224dc3ca8331?auto=format&fit=crop&w=2400&q=85", eyebrow: "TENIS DE MESA · MIRAFLORES", title: <>Cada punto<br/>te acerca a <em>más.</em></>, text: "Entrenamiento con propósito, buenos profesores y una comunidad que te impulsa a mejorar.", cta: "Conoce la academia" },
  { image: "https://images.unsplash.com/photo-1786025106050-1aa8eaa5ad3e?auto=format&fit=crop&w=2400&q=85", eyebrow: "TU JUEGO, A TU RITMO", title: <>Aprende. Entrena.<br/><em>Vuelve mejor.</em></>, text: "Encuentra tu nivel, construye técnica y disfruta cada sesión dentro y fuera de la mesa.", cta: "Quiero entrenar" },
  { image: "https://images.unsplash.com/photo-1708268418738-4863baa9cf72?auto=format&fit=crop&w=2400&q=85", eyebrow: "JUEGA CON LA COMUNIDAD", title: <>La próxima pelota<br/>puede ser <em>tuya.</em></>, text: "Participa en nuestros rankings, reta a otros jugadores y celebra cada avance.", cta: "Explorar rankings" },
];
const benefits = [
  { art: "paddle", title: "Correcciones en la mesa", text: "Tu profesor observa el golpe y te ayuda a ajustar el movimiento en la siguiente pelota." },
  { art: "balls", title: "Práctica en grupo", text: "Alterna compañeros y aprende a responder a otros ritmos y estilos de juego." },
  { art: "score", title: "Partidos de ranking", text: "Lleva lo que practicas a un partido con alumnos y jugadores invitados." },
];
const demoCoaches: Record<string, { portrait: string; specialty: string }> = {
  "Carlos Mendoza": { portrait: "/images/team/carlos.webp", specialty: "Técnica y control" },
  "Raúl Peña": { portrait: "/images/team/raul.webp", specialty: "Táctica de juego" },
  "Lucía Salazar": { portrait: "/images/team/lucia.webp", specialty: "Desarrollo deportivo" },
};

export default function AcademyLanding({ academyName, logoUrl, primaryColor, ranking, teachers }: Props) {
  const [slide, setSlide] = useState(0); const [menuOpen, setMenuOpen] = useState(false); const [modal, setModal] = useState<"registration" | "ranking" | null>(null);
  const current = slides[slide];
  useEffect(() => {
    if (!menuOpen) return;
    function closeMenu(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        document.getElementById("club-menu-toggle")?.focus();
      }
    }
    window.addEventListener("keydown", closeMenu);
    return () => window.removeEventListener("keydown", closeMenu);
  }, [menuOpen]);
  function go(direction: number) { setSlide((n) => (n + direction + slides.length) % slides.length); }
  useEffect(() => {
    if (modal || menuOpen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setSlide((n) => (n + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, [modal, menuOpen]);
  useEffect(()=>{if(!ranking||ranking.id!=="demo-ranking")return;try{const key="ttacademias:rankings";const saved=JSON.parse(localStorage.getItem(key)||"[]") as Array<Record<string,unknown>&{id:string}>;if(!saved.some(item=>item.id===ranking.id)){const date=new Date(ranking.startsAt);saved.push({id:ranking.id,title:ranking.title,date:date.toISOString().slice(0,10),time:date.toLocaleTimeString("es-PE",{hour:"numeric",minute:"2-digit"}),venue:ranking.venue,studentPrice:Number(ranking.studentPrice),publicPrice:Number(ranking.publicPrice),capacity:ranking.capacity,participants:[]});localStorage.setItem(key,JSON.stringify(saved))}}catch{}},[ranking]);
  return <main className="academy-landing-v2" style={{ ["--brand" as string]: primaryColor } as React.CSSProperties}>
    <header className="club-header">
      <div className="club-nav">
        <a href="#inicio" className="club-wordmark">
          <span>{logoUrl ? <img src={logoUrl} alt="" /> : <Activity size={21} />}</span>
          {academyName}
        </a>
        <nav aria-label="Navegación principal" id="club-navigation" data-open={menuOpen}
          onClick={() => setMenuOpen(false)}>
          <a href="#inicio">Inicio</a>
          <a href="#academia">La academia</a>
          <a href="#equipo">Equipo técnico</a>
          <a href="#ranking">Rankings</a>
          <Link href="/login" className="club-login">Ingresar</Link>
          <button type="button" className="club-action" onClick={() => setModal("registration")}>Matricularme</button>
        </nav>
        <button type="button" id="club-menu-toggle" className="club-nav-toggle" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen} aria-controls="club-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
    <section id="inicio" className="landing-hero-v2 club-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(0,20,38,.90),rgba(0,20,38,.59) 48%,rgba(0,20,38,.18)),url("${current.image}")`}}>
      <div className="hero-v2-copy" key={slide}>
        <h1>{current.title}</h1><p>{current.text}</p>
        <div className="hero-v2-actions">
          {slide === 1
            ? <button type="button" className="club-action" onClick={() => setModal("registration")}>{current.cta}</button>
            : <a className="club-action" href={slide === 2 ? "#ranking" : "#academia"}>{current.cta}</a>}
        </div>
      </div>
      <div className="hero-v2-controls"><div>
        <button onClick={() => go(-1)} aria-label="Imagen anterior"><ArrowLeft /></button>
        <button onClick={() => go(1)} aria-label="Imagen siguiente"><ArrowRight /></button>
      </div></div>
    </section>

    <section id="academia" className="club-section club-intro">
      <div className="club-intro-copy">
        <h2>Entrena a tu nivel.</h2>
        <p>Desde tus primeros saques hasta los partidos de competencia, en {academyName} encontrarás un grupo para practicar a tu ritmo.</p>
        <button type="button" className="club-action" onClick={() => setModal("registration")}>Matricúlate en la academia</button>
      </div>
      <div className="club-training-preview">
        <img src={slides[2].image} alt="Mesa de tenis preparada para la práctica" loading="lazy" />

      </div>
    </section>

    <section id="beneficios" className="club-practice">
      <div className="club-section club-practice-layout">
        <h2>Lo que te llevas de cada sesión.</h2>
        <div className="club-benefit-grid">
          {benefits.map(({art, title, text}) => (
            <article key={art}>
              <div aria-hidden="true" className={`club-object club-object-${art}`}>
                {art === "score" && <><span>10</span><span>08</span></>}
              </div>
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
    <section id="equipo" className="club-section club-staff">
      <h2>El equipo técnico.</h2>
      <div className="club-roster">
        {(teachers.length ? teachers : Object.keys(demoCoaches)).map((name) => {
          const profile = demoCoaches[name];
          return <figure key={name}>
            <div className="club-portrait">
              {profile ? <img loading="lazy" alt="" src={profile.portrait}/>
                : <span aria-hidden="true">{name.split(" ").map(part => part[0]).slice(0,2).join("")}</span>}
            </div>
            <figcaption><h3>{name}</h3>{profile && <p>{profile.specialty}</p>}</figcaption>
          </figure>;
        })}
      </div>
    </section>
    <section id="ranking" className="landing-ranking-v2"><div className="ranking-v2-orb"/><div className="ranking-v2-copy"><h2>{ranking?<>Ranking Relámpago<br/><em>de la Academia</em></>:<>Consulta el ranking<br/><em>de la academia</em></>}</h2><p>{ranking?"Revisa los detalles y asegura tu lugar en el próximo encuentro.":"Revisa la tabla de posiciones y descubre cómo avanza la comunidad de la academia."}</p><a href="/rankings" className="ranking-v2-link">Ver tabla de posiciones</a></div>{ranking?<article className="ranking-v2-card"><div className="ranking-status-v2">Inscripción abierta</div><h3>{ranking.title}</h3><div className="ranking-facts-v2"><p><CalendarDays size={17}/><span><small>Fecha y hora</small><strong>{new Date(ranking.startsAt).toLocaleString("es-PE",{dateStyle:"medium",timeStyle:"short"})}</strong></span></p><p><Activity size={17}/><span><small>Sede</small><strong>{ranking.venue}</strong></span></p></div><div className="ranking-prices-v2"><div><small>Tarifa estudiante</small><strong>S/ {Number(ranking.studentPrice).toFixed(2)}</strong></div><div><small>Tarifa externa</small><strong>S/ {Number(ranking.publicPrice).toFixed(2)}</strong></div></div><div className="ranking-card-footer-v2"><span>Aforo máximo: {ranking.capacity} jugadores</span><button type="button" onClick={()=>setModal("ranking")} className="ranking-v2-primary">Inscribirme</button></div></article>:<div className="ranking-v2-empty"><Trophy size={26}/><strong>Pronto habrá un nuevo ranking</strong><span>La tabla de posiciones de la academia está disponible para consulta.</span></div>}</section>
    <footer className="landing-footer-v2"><Link href="#inicio" className="landing-brand-v2"><span><Activity size={18}/></span>{academyName}</Link><span>Tenis de mesa, comunidad y progreso.</span><Link href="/login">Acceso para alumnos y profesores</Link></footer>
    {modal && (
      <Modal className={`public-form-dialog ${modal === "registration" ? "enroll" : "ranking"}`}
        label={modal === "registration" ? "Matricularme" : "Inscripción al ranking"}
        onDismiss={() => setModal(null)}>
        <button type="button" className="dialog-exit" onClick={() => setModal(null)} aria-label="Cerrar">
          <X size={18}/>
        </button>
        {modal === "registration" ? <RegistrationForm embedded/> : ranking && <RankingRegistration rankingId={ranking.id} embedded/>}
      </Modal>
    )}
  </main>;
}
