"use client";

import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Award,
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Home,
  LogOut,
  MapPin,
  Medal,
  MoreVertical,
  RotateCcw,
  Settings,
  ShieldCheck,
  Star,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";

type Tab = "Inicio" | "Mis Clases" | "Rankings" | "Mi Perfil";

const tabs: { label: Tab; icon: typeof Home }[] = [
  { label: "Inicio", icon: Home },
  { label: "Mis Clases", icon: CalendarDays },
  { label: "Rankings", icon: Trophy },
  { label: "Mi Perfil", icon: UserRound },
];

const sessions = [
  { day: "VIE", date: "20", title: "Táctica de Partido & Transiciones", time: "7:00 PM - 8:30 PM", coach: "Prof. Raúl Peña", initials: "RP", tone: "rose" },
  { day: "SÁB", date: "21", title: "Multibolas & Potencia Física", time: "10:00 AM - 11:30 AM", coach: "Prof. Carlos Mendoza", initials: "CM", tone: "wine" },
  { day: "MAR", date: "24", title: "Juego Corto y Recepción de Puntos", time: "6:00 PM - 7:30 PM", coach: "Prof. Raúl Peña", initials: "RP", tone: "sand" },
];

const standings = [
  { rank: 1, initials: "RA", name: "Rodrigo Alvarado", points: "2,140" },
  { rank: 2, initials: "VC", name: "Vanessa Cárdenas", points: "1,780" },
  { rank: 3, initials: "JL", name: "Joaquín Lozano", points: "1,695" },
  { rank: 4, initials: "MS", name: "Martín Silva", points: "1,580" },
  { rank: 5, initials: "EP", name: "Esteban Paredes", points: "1,510" },
];

export default function StudentPortal() {
  const [tab, setTab] = useState<Tab>("Inicio");
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function navigate(next: Tab) {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        {tab === "Inicio" ? (
          <div className="welcome-block">
            <div className="avatar avatar-initial">M</div>
            <div>
              <p className="hello">Hola, Mateo</p>
              <p className="location"><MapPin size={15} /> Sede Miraflores</p>
            </div>
          </div>
        ) : (
          <div className="brand">
            <div className="brand-mark"><Activity size={20} strokeWidth={2.6} /></div>
            <span>Spin<span className="brand-light">Academy</span></span>
          </div>
        )}
        <button className="icon-button notification-button" aria-label="Notificaciones" onClick={() => showToast("No tienes nuevas notificaciones")}>
          <Bell size={20} />
          <span className="notification-dot" />
        </button>
      </header>

      <section className="content" key={tab}>
        {tab === "Inicio" && (
          <>
            <div className="mobile-welcome"><h1>Tu espacio para mejorar.</h1><p>Todo lo de tu academia, a un toque.</p></div>
            {noticeVisible && <section className="notice-card" aria-label="Aviso de sede">
              <div className="notice-icon"><Activity size={18} /></div>
              <div className="notice-copy"><p className="notice-eyebrow">AVISO DE SEDE</p><p>Tu clase de hoy iniciará 15 minutos más tarde (<strong>6:15 PM</strong>) por desinfección y acondicionamiento reglamentario de mesas.</p></div>
              <button className="dismiss-button" onClick={() => setNoticeVisible(false)} aria-label="Cerrar aviso"><span>Entendido</span><X size={15} /></button>
            </section>}

            <section className="section-block">
              <div className="section-heading"><h2>Mi Clase de Hoy</h2><span className="muted">Miércoles, 18 Nov</span></div>
              <article className="card class-card">
                <div className="class-meta"><span className="time-pill"><span className="dot" />Hoy · 6:00 PM - 7:30 PM</span><span className="duration"><Clock3 size={15} />90 min</span></div>
                <h3>Nivel Intermedio: Control de Saques &amp; Topspin</h3>
                <p className="subtle">Fase de técnica y lectura de efecto</p>
                <div className="coach-box"><span className="label">PROFESOR</span><div className="coach-line"><div className="avatar avatar-coach">CM</div><strong>C. Mendoza</strong></div></div>
                <button className={`button button-primary button-full ${attendanceConfirmed ? "button-success" : ""}`} onClick={() => { setAttendanceConfirmed(true); showToast("Clase de hoy confirmada en Mesa 04"); }}>
                  {attendanceConfirmed ? <Check size={17} /> : <CheckCircle2 size={17} />}{attendanceConfirmed ? "Asistencia Confirmada" : "Confirmar Asistencia"}
                </button>
              </article>
            </section>

            <section className="section-block">
              <div className="section-heading"><h2>Membresía &amp; Facturación</h2><span className="status-badge">Activa</span></div>
              <article className="card membership-card">
                <div className="membership-title"><div><h3>Plan Competitivo Mensual</h3><p className="subtle">Acceso total a sedes y mesas de práctica</p></div><strong className="price">S/. 280.00 <small>/ mes</small></strong></div>
                <div className="due-row"><span>Vence el 20 Nov 2026</span><strong>Quedan 5 días</strong></div>
                <div className="progress-track"><span style={{ width: "82%" }} /></div>
                <div className="renew-row"><span>Renovación automática opcional</span><button className="button button-soft" onClick={() => showToast("La renovación estará disponible pronto")}>Renovar</button></div>
              </article>
            </section>

            <section className="section-block last-section">
              <div className="section-heading"><h2>Próximo Torneo</h2></div>
              <article className="card tournament-card compact-tournament">
                <div className="tournament-top"><div><span className="eyebrow">RANKING SEMANAL #14</span><h3>Torneo Relámpago Apertura</h3></div><div className="trophy-badge"><Trophy size={20} /></div></div>
                <p className="subtle">Sábado 21 Nov • 4:00 PM (4 horas garantizadas)</p>
                <div className="capacity-strip"><span>Cupos disponibles:</span><strong>{registered ? "17" : "16"} / 20 inscritos <span className="green-dot" /></strong></div>
                <div className="tournament-footer"><div><del>General: S/. 40.00</del><p>Tarifa Alumno: <strong>S/. 25.00</strong></p></div><button className="button button-primary" onClick={() => { setRegistered(!registered); showToast(registered ? "Cancelaste tu inscripción" : "¡Ya estás inscrito al torneo!"); }}>{registered ? "Inscrito" : "Inscribirme"}</button></div>
              </article>
            </section>
          </>
        )}

        {tab === "Mis Clases" && <ClassesView onToast={showToast} />}
        {tab === "Rankings" && <RankingsView onToast={showToast} />}
        {tab === "Mi Perfil" && <ProfileView onToast={showToast} />}
      </section>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {tabs.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${tab === label ? "active" : ""}`} onClick={() => navigate(label)} aria-current={tab === label ? "page" : undefined}>
          <Icon size={21} strokeWidth={tab === label ? 2.5 : 2.1} /><span>{label}</span>
        </button>)}
      </nav>
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}<button aria-label="Cerrar mensaje" onClick={() => setToast("")}><X size={17} /></button></div>}
    </main>
  );
}

function ClassesView({ onToast }: { onToast: (message: string) => void }) {
  const [selectedDay, setSelectedDay] = useState(18);
  const [filter, setFilter] = useState("Próximas (3)");
  return <>
    <div className="page-title"><h1>Mis Clases</h1><p>Noviembre 2026 • 8 sesiones restantes en tu plan</p></div>
    <section className="card week-card">
      <div className="week-heading"><h2>Semana 47</h2><div><button className="calendar-arrow" aria-label="Semana anterior" onClick={() => onToast("Mostrando la semana anterior")}><ChevronLeft size={18} /></button><button className="calendar-arrow" aria-label="Semana siguiente" onClick={() => onToast("Mostrando la semana siguiente")}><ChevronRight size={18} /></button></div></div>
      <div className="week-days">{[{ d: "L", n: 16 }, { d: "M", n: 17 }, { d: "X", n: 18 }, { d: "J", n: 19 }, { d: "V", n: 20 }, { d: "S", n: 21 }, { d: "D", n: 22 }].map((day) => <button key={day.n} className={`day-cell ${selectedDay === day.n ? "selected" : ""}`} onClick={() => setSelectedDay(day.n)}><span>{day.d}</span><strong>{day.n}</strong>{[18, 20, 21].includes(day.n) && <i />}</button>)}</div>
    </section>
    <div className="filter-row">{["Próximas (3)", "Historial", "Clases Particulares"].map((item) => <button key={item} className={`filter-chip ${filter === item ? "selected" : ""}`} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="section-heading class-day-heading"><h2><span className="dot" /> CLASE DE HOY</h2><span className="muted">Miércoles 18 Nov</span></div>
    <article className="card today-class-card">
      <div className="today-class-time"><Clock3 size={19} /><strong>6:00 PM - 7:30 PM</strong></div><p className="subtle">Duración: 90 minutos</p>
      <div className="level-strip">Intermedio: Control de Saques &amp; Topspin</div>
      <div className="teacher-row"><div className="avatar avatar-coach large">CM</div><div className="teacher-info"><strong>Prof. Carlos Mendoza</strong><span><Star size={15} fill="currentColor" /> 4.9 <i>(128 clases)</i></span></div><span className="confirmed-badge"><CheckCircle2 size={14} /> Confirmada</span></div>
    </article>
    <section className="section-block upcoming-block"><div className="section-heading"><h2>Próximas Sesiones</h2><button className="text-link" onClick={() => onToast("Mostrando todas tus sesiones")}>Ver más completo</button></div>
      <div className="session-list">{sessions.map((session) => <article className="card session-card" key={session.title}><div className="date-tile"><span>{session.day}</span><strong>{session.date}</strong></div><div className="session-info"><strong>{session.title}</strong><p>{session.time} • {session.coach}</p></div><div className={`avatar avatar-small ${session.tone}`}>{session.initials}</div><button className="more-button" aria-label={`Más opciones para ${session.title}`} onClick={() => onToast("Opciones de sesión") }><MoreVertical size={20} /></button></article>)}</div>
    </section>
    <article className="card recover-card"><div className="recover-icon"><RotateCcw size={20} /></div><div><strong>¿Perdiste una clase?</strong><p>Tienes 1 clase pendiente por reprogramar</p></div><button className="button button-primary" onClick={() => onToast("Estamos buscando clases disponibles")}>Recuperar <ArrowRight size={16} /></button></article>
  </>;
}

function RankingsView({ onToast }: { onToast: (message: string) => void }) {
  return <>
    <div className="page-title"><h1>Torneos y Rankings</h1><p>Competencias oficiales y mini-campeonatos de SpinAcademy.</p></div>
    <article className="card player-ranking-card"><div className="player-overview"><div className="avatar avatar-player">MG</div><div><h2>Mateo Gonzales</h2><p>Categoría Federada · Afiliado 2024</p></div><div className="medal-icon"><Medal size={20} /></div></div><div className="ranking-summary"><div className="summary-symbol"><Activity size={18} /></div><div><span>SPINACADEMY</span><strong>Ranking Institucional</strong></div><b>#14</b><small>de 120</small></div></article>
    <section className="section-block ranking-event-block"><div className="section-heading"><h2>Próximo Torneo</h2></div><article className="card tournament-detail-card">
      <span className="registered-label"><i /> Inscrito</span><h2>Torneo Relámpago #14</h2><div className="event-info"><span><CalendarDays size={15} />Sábado 21 Nov, 4:00 PM</span><span><MapPin size={15} />Av. Precursores 241-San Miguel</span></div>
      <div className="confirmed-slots"><span><Users size={16} /> Cupos Confirmados</span><strong>16 / 20 jugadores</strong><div className="progress-track"><span style={{ width: "80%" }} /></div></div>
      <div className="group-heading"><h3><span className="dot" /> Grupo B (Mesa 6)</h3><span>5 Jugadores</span></div>
      <div className="group-list">{[{ n: 1, init: "VC", name: "Vanessa Cárdenas", points: "1,780 pts" }, { n: 2, init: "MG", name: "Mateo Gonzales (Tú)", points: "1,420 pts", self: true }, { n: 3, init: "NT", name: "Nicole Torres", points: "1,280 pts" }, { n: 4, init: "DV", name: "Diego Vásquez", points: "1,150 pts" }, { n: 5, init: "CR", name: "Carlos Ramos", points: "1,090 pts" }].map((player) => <div className={`group-player ${player.self ? "self" : ""}`} key={player.n}><span className="group-number">{player.n}</span><div className="avatar avatar-tiny">{player.init}</div><strong>{player.name}</strong><b>{player.points}</b></div>)}</div>
      <button className="button button-primary button-full group-button" onClick={() => onToast("Los grupos se publicarán antes del torneo") }><Users size={17} /> Ver Grupos</button>
    </article></section>
    <section className="section-block standings-block"><div className="section-heading"><h2>Tabla de Clasificación</h2></div><article className="card standings-card">{standings.map((player) => <div className="standing-row" key={player.rank}><span className="rank-circle">{player.rank}</span><div className="avatar avatar-tiny">{player.initials}</div><strong>{player.name}</strong><div className="standing-points"><b>{player.points}</b><span>puntos</span></div></div>)}<div className="my-rank-row"><strong>#14</strong><span>Mateo Gonzales (Tu posición)</span><b>1,420 pts</b><ArrowRight size={16} /></div></article></section>
  </>;
}

function ProfileView({ onToast }: { onToast: (message: string) => void }) {
  return <>
    <div className="page-title"><h1>Mi Perfil</h1><p>Administra tu cuenta y tus preferencias.</p></div>
    <article className="card profile-card"><div className="profile-avatar">MG</div><div className="profile-main"><h2>Mateo Gonzales</h2><p>Estudiante · SpinAcademy</p><span className="status-badge">Membresía activa</span></div><button className="icon-button" aria-label="Editar perfil" onClick={() => onToast("Edición de perfil próximamente")}><Settings size={19} /></button></article>
    <section className="section-block profile-section"><h2>Mi cuenta</h2><div className="card settings-card">
      <button className="settings-row" onClick={() => onToast("Mostrando información personal")}><UserRound size={19} /><span><strong>Información personal</strong><small>Nombre, correo y teléfono</small></span><ChevronRight size={18} /></button>
      <button className="settings-row" onClick={() => onToast("Mostrando plan y pagos")}><CreditCard size={19} /><span><strong>Plan y pagos</strong><small>Plan Competitivo Mensual</small></span><ChevronRight size={18} /></button>
      <button className="settings-row" onClick={() => onToast("Tus preferencias están actualizadas")}><Bell size={19} /><span><strong>Notificaciones</strong><small>Clases, avisos y torneos</small></span><ChevronRight size={18} /></button>
      <button className="settings-row" onClick={() => onToast("Centro de ayuda próximamente")}><CircleHelp size={19} /><span><strong>Centro de ayuda</strong><small>Resuelve tus dudas</small></span><ChevronRight size={18} /></button>
    </div></section>
    <section className="section-block profile-section"><h2>Privacidad y seguridad</h2><div className="card settings-card">
      <button className="settings-row" onClick={() => onToast("Tu cuenta está protegida")}><ShieldCheck size={19} /><span><strong>Seguridad de la cuenta</strong><small>Contraseña y acceso</small></span><ChevronRight size={18} /></button>
      <button className="settings-row logout-row" onClick={() => window.location.assign("/login")}><LogOut size={19} /><span><strong>Cerrar sesión</strong></span><ChevronRight size={18} /></button>
    </div></section>
    <div className="profile-footnote"><CalendarCheck size={16} /> Miembro desde marzo de 2024</div>
  </>;
}
