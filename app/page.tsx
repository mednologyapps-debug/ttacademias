import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowRight, CalendarDays, Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function PortalHome() {
  try {
    const user = await getCurrentUser();
    if (user) redirect(user.role === "student" ? "/estudiante" : user.role === "teacher" ? "/profesor" : user.role === "academy_admin" ? "/admin" : "/global-admin");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
  }
  return <main className="public-portal-home">
    <header className="public-portal-header"><Link href="/" className="public-portal-brand"><span><Activity size={20}/></span>TT Academias</Link><nav><Link href="/login">Iniciar sesión</Link><Link href="/registro">Crear cuenta</Link></nav></header>
    <section className="public-portal-hero"><div className="public-portal-copy"><span className="public-portal-eyebrow">TU ACADEMIA, EN UN SOLO LUGAR</span><h1>Todo tu tenis de mesa,<br/><em>más cerca.</em></h1><p>Consulta tus clases, confirma tu asistencia y sigue los rankings de tu academia desde cualquier dispositivo.</p><div className="public-portal-actions"><Link href="/login" className="public-portal-primary">Ingresar a mi portal <ArrowRight size={17}/></Link><Link href="/registro" className="public-portal-secondary">Crear cuenta de estudiante</Link></div><div className="public-portal-trust"><span><CalendarDays size={16}/>Tus clases y avisos</span><span><Trophy size={16}/>Rankings y resultados</span></div></div><div className="public-portal-preview"><div className="portal-preview-top"><span className="preview-brand-icon"><Activity size={16}/></span><b>Mi academia</b><i/></div><div className="preview-hello"><small>MIÉRCOLES, 18 NOV</small><h2>Hola, Mateo</h2><p>Esto es lo que pasa hoy.</p></div><article className="preview-today"><span>CLASE DE HOY</span><b>6:00 PM – 7:30 PM</b><p>Intermedio · Control de saques</p><div>Carlos Mendoza <span>Confirmada</span></div></article><div className="preview-mini-cards"><span>◷ &nbsp; Mis clases<small>Tu agenda semanal</small></span><span>♜ &nbsp; Rankings<small>Compite y mejora</small></span></div></div></section>
    <footer className="public-portal-footer">Accede con la cuenta de tu academia · Optimizado para celular y escritorio</footer>
  </main>;
}
