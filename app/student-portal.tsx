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
  const [attendance, setAttendance] = useState<"yes" | "no" | null>(null);
  // Sample state: this student already paid and is registered for the displayed ranking.
  const [rankingPaid] = useState(true);
  const [registered, setRegistered] = useState(true);
  const [paymentView, setPaymentView] = useState<"history" | "renew" | null>(null);
  const [toast, setToast] = useState("");

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function navigate(next: Tab) {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function markAttendance(value: "yes" | "no") {
    setAttendance(value);
    showToast(value === "yes" ? "Marcaste que asistirás a la clase" : "Marcaste que no asistirás a la clase");
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
                <div className="attendance-actions">
                  <button className={`button ${attendance === "yes" ? "button-success" : "button-primary"}`} onClick={() => markAttendance("yes")}><CheckCircle2 size={16} />{attendance === "yes" ? "Asistiré" : "Sí, asistiré"}</button>
                  <button className={`button ${attendance === "no" ? "button-decline-selected" : "button-soft"}`} onClick={() => markAttendance("no")}>{attendance === "no" ? "No asistiré ✓" : "No asistiré"}</button>
                </div>
              </article>
            </section>

            <section className="section-block">
              <div className="section-heading"><h2>Membresía &amp; Facturación</h2><span className="status-badge">Activa</span></div>
              <article className="card membership-card">
                <div className="membership-title"><div><h3>Plan Competitivo Mensual</h3><p className="subtle">Acceso total a sedes y mesas de práctica</p></div><strong className="price">S/. 280.00 <small>/ mes</small></strong></div>
                <div className="due-row"><span>Vence el 20 Nov 2026</span><strong>Quedan 5 días</strong></div>
                <div className="progress-track"><span style={{ width: "82%" }} /></div>
                <div className="renew-row"><button className="text-link" onClick={() => setPaymentView("history")}>Ver historial de pagos</button><button className="button button-primary" onClick={() => setPaymentView("renew")}>Renovar plan</button></div>
              </article>
            </section>

            <section className="section-block last-section">
              <div className="section-heading"><h2>Próximo Torneo</h2></div>
              <article className="card tournament-card compact-tournament">
                <div className="tournament-top"><div><span className="eyebrow">RANKING SEMANAL #14</span><h3>Torneo Relámpago Apertura</h3></div><div className="trophy-badge"><Trophy size={20} /></div></div>
                <p className="subtle">Sábado 21 Nov • 4:00 PM (4 horas garantizadas)</p>
                <div className="capacity-strip"><span>Cupos disponibles:</span><strong>{registered ? "17" : "16"} / 20 inscritos <span className="green-dot" /></strong></div>
                <div className="tournament-footer"><div><del>General: S/. 40.00</del><p>Tarifa Alumno: <strong>S/. 25.00</strong></p></div><button className="button button-primary" disabled={registered || !rankingPaid} onClick={() => { if (!rankingPaid) { showToast("Debes pagar la tarifa antes de inscribirte"); return; } setRegistered(true); showToast("¡Ya estás inscrito al ranking!"); }}>{registered ? "Inscrito" : rankingPaid ? "Inscribirme" : "Pagar S/. 25.00"}</button></div>
              </article>
            </section>
          </>
        )}

        {tab === "Mis Clases" && <ClassesView onToast={showToast} attendance={attendance} onMarkAttendance={markAttendance} />}
        {tab === "Rankings" && <RankingsView onToast={showToast} />}
        {tab === "Mi Perfil" && <ProfileView onToast={showToast} onPaymentHistory={() => setPaymentView("history")} />}
      </section>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {tabs.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${tab === label ? "active" : ""}`} onClick={() => navigate(label)} aria-current={tab === label ? "page" : undefined}>
          <Icon size={21} strokeWidth={tab === label ? 2.5 : 2.1} /><span>{label}</span>
        </button>)}
      </nav>
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}<button aria-label="Cerrar mensaje" onClick={() => setToast("")}><X size={17} /></button></div>}
      {paymentView && <PaymentsModal mode={paymentView} onClose={() => setPaymentView(null)} onContinue={() => { setPaymentView(null); showToast("El pago se podrá completar al conectar la pasarela de la academia"); }} />}
    </main>
  );
}

function ClassesView({ onToast, attendance, onMarkAttendance }: { onToast: (message: string) => void; attendance: "yes" | "no" | null; onMarkAttendance: (value: "yes" | "no") => void }) {
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
      <div className="teacher-row"><div className="avatar avatar-coach large">CM</div><div className="teacher-info"><strong>Prof. Carlos Mendoza</strong><span><Star size={15} fill="currentColor" /> 4.9 <i>(128 clases)</i></span></div><span className={`attendance-status ${attendance === "no" ? "declined" : ""}`}>{attendance === "yes" ? "Asistiré" : attendance === "no" ? "No asistiré" : "Sin confirmar"}</span></div>
      <div className="attendance-actions class-attendance-actions"><button className={`button ${attendance === "yes" ? "button-success" : "button-primary"}`} onClick={() => onMarkAttendance("yes")}><CheckCircle2 size={16} />Sí, asistiré</button><button className={`button ${attendance === "no" ? "button-decline-selected" : "button-soft"}`} onClick={() => onMarkAttendance("no")}>No asistiré</button></div>
    </article>
    <section className="section-block upcoming-block"><div className="section-heading"><h2>Próximas Sesiones</h2><button className="text-link" onClick={() => onToast("Mostrando todas tus sesiones")}>Ver más completo</button></div>
      <div className="session-list">{sessions.map((session) => <article className="card session-card" key={session.title}><div className="date-tile"><span>{session.day}</span><strong>{session.date}</strong></div><div className="session-info"><strong>{session.title}</strong><p>{session.time} • {session.coach}</p></div><div className={`avatar avatar-small ${session.tone}`}>{session.initials}</div><button className="more-button" aria-label={`Más opciones para ${session.title}`} onClick={() => onToast("Opciones de sesión") }><MoreVertical size={20} /></button></article>)}</div>
    </section>
  </>;
}

function RankingsView({ onToast }: { onToast: (message: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [paidIds, setPaidIds] = useState<string[]>(["weekly-14"]);
  const [registeredIds, setRegisteredIds] = useState<string[]>(["weekly-14"]);
  const [paying, setPaying] = useState(false);
  const events = [
    { id: "weekly-14", title: "Torneo Relámpago Apertura #14", date: "Sábado 21 Nov · 4:00 PM", venue: "Av. Precursores 241 · San Miguel", capacity: 20, enrolled: 16, memberPrice: "S/. 25.00", publicPrice: "S/. 40.00", state: "Inscripción abierta", registered: true },
    { id: "weekly-15", title: "Ranking Semanal #15", date: "Sábado 28 Nov · 3:00 PM", venue: "Sede Miraflores · Lima", capacity: 20, enrolled: 9, memberPrice: "S/. 25.00", publicPrice: "S/. 40.00", state: "Inscripción abierta", registered: false },
    { id: "mini-16", title: "Mini Ranking de diciembre", date: "Sábado 05 Dic · 4:00 PM", venue: "Sede San Miguel · Lima", capacity: 16, enrolled: 5, memberPrice: "S/. 20.00", publicPrice: "S/. 35.00", state: "Inscripción abierta", registered: false },
  ];
  const event = events.find((item) => item.id === selected);
  const paid = selected ? paidIds.includes(selected) : false;
  const registered = selected ? registeredIds.includes(selected) : false;
  function confirmRegistration() {
    if (!selected || !paid) return;
    setRegisteredIds((current) => current.includes(selected) ? current : [...current, selected]);
    onToast("Inscripción confirmada. Te esperamos en el ranking.");
  }
  return <>
    <div className="page-title"><h1>Torneos y Rankings</h1><p>Explora las competencias activas de tu academia.</p></div>
    {!event ? <>
      <article className="card player-ranking-card"><div className="player-overview"><div className="avatar avatar-player">MG</div><div><h2>Mateo Gonzales</h2><p>Categoría Federada · Afiliado 2024</p></div><div className="medal-icon"><Medal size={20} /></div></div><div className="ranking-summary"><div className="summary-symbol"><Activity size={18} /></div><div><span>SPINACADEMY</span><strong>Ranking Institucional</strong></div><b>#14</b><small>de 120</small></div></article>
      <section className="section-block ranking-event-block"><div className="section-heading"><h2>Rankings activos</h2><span className="muted">{events.length} competencias</span></div>
        <div className="active-ranking-list">{events.map((item) => <article className="card active-ranking-card" key={item.id}><div className="active-ranking-icon"><Trophy size={20} /></div><div className="active-ranking-copy"><span className="registered-label"><i />{item.state}</span><h3>{item.title}</h3><p><CalendarDays size={14} />{item.date}</p><p><MapPin size={14} />{item.venue}</p><div className="active-ranking-meta"><span>{item.enrolled} / {item.capacity} inscritos</span><strong>Alumno {item.memberPrice}</strong></div></div><button className="button button-primary ranking-detail-link" onClick={() => setSelected(item.id)}>Ver detalles <ChevronRight size={16} /></button></article>)}</div>
      </section>
      <section className="section-block standings-block"><div className="section-heading"><h2>Tabla de Clasificación</h2><span className="muted">Temporada 2026</span></div><article className="card standings-card">{standings.map((player) => <div className="standing-row" key={player.rank}><span className="rank-circle">{player.rank}</span><div className="avatar avatar-tiny">{player.initials}</div><strong>{player.name}</strong><div className="standing-points"><b>{player.points}</b><span>puntos</span></div></div>)}<div className="my-rank-row"><strong>#14</strong><span>Mateo Gonzales (Tu posición)</span><b>1,420 pts</b><ArrowRight size={16} /></div></article></section>
    </> : <>
      <button className="back-link ranking-back" onClick={() => { setSelected(null); setPaying(false); }}><ChevronLeft size={17} /> Volver a rankings activos</button>
      <div className="ranking-detail-layout"><article className="card tournament-detail-card"><span className={`registered-label ${registered ? "" : "pending"}`}><i />{registered ? "Inscrito · pago confirmado" : paid ? "Pago confirmado" : "Inscripción abierta"}</span><div className="ranking-detail-title"><div><span className="eyebrow">RANKING DE ACADEMIA</span><h2>{event.title}</h2></div><div className="trophy-badge"><Trophy size={20} /></div></div><p className="ranking-description">Compite con estudiantes de la academia y suma puntos para la tabla institucional.</p><div className="event-info"><span><CalendarDays size={15} />{event.date}</span><span><MapPin size={15} />{event.venue}</span></div><div className="confirmed-slots"><span><Users size={16} /> Cupos disponibles</span><strong>{event.enrolled} / {event.capacity} inscritos</strong><div className="progress-track"><span style={{ width: `${event.enrolled / event.capacity * 100}%` }} /></div></div><div className="ranking-prices"><div><span>Tarifa general</span><del>{event.publicPrice}</del></div><div><span>Tarifa estudiante</span><strong>{event.memberPrice}</strong></div></div>
        {!registered && !paid && <div className="ranking-payment-hint"><CreditCard size={17} /><span>La inscripción se habilita cuando el pago quede aprobado.</span></div>}
        {registered ? <div className="ranking-registered-panel"><CheckCircle2 size={19} /><div><strong>Tu cupo está confirmado</strong><span>El profesor publicará los grupos antes del inicio.</span></div></div> : paid ? <button className="button button-primary button-full group-button" onClick={confirmRegistration}>Confirmar inscripción</button> : <button className="button button-primary button-full group-button" onClick={() => setPaying(true)}>Pagar {event.memberPrice} para inscribirme</button>}
        {registered && <><div className="group-heading"><h3><span className="dot" /> Grupo asignado</h3><span>5 jugadores</span></div><div className="group-list">{[{ n: 1, init: "VC", name: "Vanessa Cárdenas", points: "1,780 pts" }, { n: 2, init: "MG", name: "Mateo Gonzales (Tú)", points: "1,420 pts", self: true }, { n: 3, init: "NT", name: "Nicole Torres", points: "1,280 pts" }, { n: 4, init: "DV", name: "Diego Vásquez", points: "1,150 pts" }, { n: 5, init: "CR", name: "Carlos Ramos", points: "1,090 pts" }].map((player) => <div className={`group-player ${player.self ? "self" : ""}`} key={player.n}><span className="group-number">{player.n}</span><div className="avatar avatar-tiny">{player.init}</div><strong>{player.name}</strong><b>{player.points}</b></div>)}</div></>}
      </article><aside className="card ranking-steps-card"><span className="eyebrow">¿CÓMO PARTICIPAR?</span><ol><li className="done"><b>1</b><span><strong>Elige un ranking</strong><small>Revisa fecha, sede y cupos.</small></span></li><li className={paid ? "done" : "current"}><b>2</b><span><strong>Paga tu tarifa</strong><small>Precio especial para estudiantes.</small></span></li><li className={registered ? "done" : "current"}><b>3</b><span><strong>Confirma tu inscripción</strong><small>Tu cupo queda reservado al confirmar.</small></span></li></ol><p>Las inscripciones confirmadas no se pueden retirar.</p></aside></div>
      {paying && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPaying(false); }}><section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="ranking-pay-title"><div className="modal-heading"><div><span className="login-eyebrow">PAGO DE RANKING</span><h2 id="ranking-pay-title">Completar inscripción</h2></div><button className="icon-button" aria-label="Cerrar" onClick={() => setPaying(false)}><X size={18} /></button></div><div className="renew-summary"><span>{event.title}</span><strong>{event.memberPrice}</strong><small>Tarifa de estudiante · Mateo Gonzales</small></div><p className="payment-note">La pasarela de pagos aún no está conectada. Para probar el flujo, puedes simular una aprobación.</p><button className="button button-primary button-full modal-pay-button" onClick={() => { setPaidIds((current) => [...current, event.id]); setPaying(false); onToast("Pago de demostración aprobado. Ya puedes confirmar tu inscripción."); }}>Simular pago aprobado</button></section></div>}
    </>}
  </>;
}

function ProfileView({ onToast, onPaymentHistory }: { onToast: (message: string) => void; onPaymentHistory: () => void }) {
  return <>
    <div className="page-title"><h1>Mi Perfil</h1><p>Administra tu cuenta y tus preferencias.</p></div>
    <article className="card profile-card"><div className="profile-avatar">MG</div><div className="profile-main"><h2>Mateo Gonzales</h2><p>Estudiante · SpinAcademy</p><span className="status-badge">Membresía activa</span></div><button className="icon-button" aria-label="Editar perfil" onClick={() => onToast("Edición de perfil próximamente")}><Settings size={19} /></button></article>
    <section className="section-block profile-section"><h2>Mi cuenta</h2><div className="card settings-card">
      <button className="settings-row" onClick={() => onToast("Mostrando información personal")}><UserRound size={19} /><span><strong>Información personal</strong><small>Nombre, correo y teléfono</small></span><ChevronRight size={18} /></button>
      <button className="settings-row" onClick={onPaymentHistory}><CreditCard size={19} /><span><strong>Plan y pagos</strong><small>Plan Competitivo Mensual · Ver historial</small></span><ChevronRight size={18} /></button>
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

function PaymentsModal({ mode, onClose, onContinue }: { mode: "history" | "renew"; onClose: () => void; onContinue: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <div className="modal-heading"><div><span className="login-eyebrow">MEMBRESÍA</span><h2 id="payment-modal-title">{mode === "history" ? "Historial de pagos" : "Renovar plan"}</h2></div><button className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={18} /></button></div>
      {mode === "history" ? <div className="payment-history-list">{[
        { date: "20 oct 2026", detail: "Plan Competitivo Mensual", amount: "S/. 280.00", status: "Pagado" },
        { date: "20 sep 2026", detail: "Plan Competitivo Mensual", amount: "S/. 280.00", status: "Pagado" },
        { date: "20 ago 2026", detail: "Plan Competitivo Mensual", amount: "S/. 280.00", status: "Pagado" },
      ].map((payment) => <article className="payment-history-item" key={payment.date}><div className="payment-icon"><CreditCard size={17} /></div><div className="payment-description"><strong>{payment.detail}</strong><span>{payment.date}</span></div><div className="payment-amount"><strong>{payment.amount}</strong><span className="status-badge">{payment.status}</span></div></article>)}</div> : <><div className="renew-summary"><span>Plan Competitivo Mensual</span><strong>S/. 280.00</strong><small>Próximo periodo: 20 nov – 20 dic 2026</small></div><p className="payment-note">El pago quedará pendiente hasta que la academia conecte su pasarela.</p><button className="button button-primary button-full modal-pay-button" onClick={onContinue}>Continuar al pago</button></>}
      <button className="modal-close-link" onClick={onClose}>Cerrar</button>
    </section>
  </div>;
}
