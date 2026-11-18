import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowRight, CalendarDays, Trophy, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getAcademySlug } from "@/lib/tenant";
import { getDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export default async function PortalHome() {
  try {
    const user = await getCurrentUser();
    if (user) redirect(user.role === "student" ? "/alumno" : user.role === "teacher" ? "/profesores" : user.role === "academy_admin" ? "/admin" : "/global-admin");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
  }
  let academy: { name: string; slug: string; logoUrl: string | null } | null = null;
  try {
    const slug = await getAcademySlug();
    if (slug) {
      const [rows] = await getDb().query<({ name: string; slug: string; logoUrl: string | null } & RowDataPacket)[]>("SELECT name,slug,logo_url AS logoUrl FROM academies WHERE slug=? AND status='active' LIMIT 1", [slug]);
      academy = rows[0] || null;
    }
  } catch { /* Local demo can show the platform landing without a configured database. */ }
  const academyName = academy?.name || "TT Academias";
  return <main className="public-portal-home">
    <header className="public-portal-header"><Link href="/" className="public-portal-brand"><span>{academy?.logoUrl ? <img src={academy.logoUrl} alt="" /> : <Activity size={20}/>}</span>{academyName}</Link><nav><Link href="/rankings">Rankings</Link><Link href="/login">Iniciar sesión</Link><Link href="/registro">Asociarme</Link></nav></header>
    <section className="public-portal-hero"><div className="public-portal-copy"><span className="public-portal-eyebrow">{academy ? "BIENVENIDO A TU ACADEMIA" : "GESTIÓN DE TENIS DE MESA"}</span><h1>{academy ? <>Entrena, compite<br/><em>y mejora.</em></> : <>Todo tu tenis de mesa,<br/><em>más cerca.</em></>}</h1><p>{academy ? `${academyName} reúne tus clases, comunidad y rankings en un solo lugar.` : "Una plataforma para conectar academias de tenis de mesa con sus alumnos y profesores."}</p><div className="public-portal-actions"><Link href="/rankings" className="public-portal-primary">Ver rankings <ArrowRight size={17}/></Link><Link href="/registro" className="public-portal-secondary">Asociarme a la academia</Link></div><div className="public-portal-trust"><span><CalendarDays size={16}/>Clases y avisos</span><span><Trophy size={16}/>Rankings abiertos</span><span><Users size={16}/>Comunidad</span></div></div><div className="public-portal-preview"><div className="portal-preview-top"><span className="preview-brand-icon">{academy?.logoUrl ? <img src={academy.logoUrl} alt=""/> : <Activity size={16}/>}</span><b>{academyName}</b><i/></div><div className="preview-hello"><small>PORTAL DE LA ACADEMIA</small><h2>Tu siguiente punto</h2><p>Clases, competencias y progreso en un mismo lugar.</p></div><article className="preview-today"><span>PRÓXIMA COMPETENCIA</span><b>Rankings de la academia</b><p>Consulta fechas, detalles, cupos y tarifas.</p><div>Inscripciones abiertas <span>Ver rankings</span></div></article><div className="preview-mini-cards"><span>◷ &nbsp; Mis clases<small>Tu agenda y asistencia</small></span><span>♜ &nbsp; Rankings<small>Compite y mejora</small></span></div></div></section>
    <footer className="public-portal-footer">{academy ? `${academyName} · ` : ""}Consulta tus servicios e ingresa desde cualquier dispositivo.</footer>
  </main>;
}
