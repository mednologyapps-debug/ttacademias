"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("La autenticación se conectará cuando configuremos las cuentas de la academia.");
  }

  return <main className="login-page">
    <section className="login-visual" aria-label="Bienvenida a SpinAcademy">
      <div className="visual-orb orb-one" /><div className="visual-orb orb-two" />
      <div className="visual-content">
        <Link href="/" className="brand login-brand"><span className="brand-mark"><Activity size={20} strokeWidth={2.6} /></span><span>Spin<span className="brand-light">Academy</span></span></Link>
        <div className="visual-copy"><span className="visual-kicker"><Sparkles size={14} /> TU SIGUIENTE PUNTO EMPIEZA AQUÍ</span><h1>Entrena con<br />un plan claro.</h1><p>Clases, seguimiento y torneos de tu academia en un solo lugar.</p></div>
        <div className="visual-quote"><div className="quote-score"><span>RANKING</span><strong>#14 <small>/ 120</small></strong><div className="score-track"><i /></div></div><div className="quote-message"><div className="quote-icon"><ShieldCheck size={19} /></div><div><strong>Tu progreso, siempre contigo</strong><p>Revisa tus sesiones y sigue mejorando.</p></div></div></div>
        <p className="visual-footer">Comunidad · Constancia · Juego</p>
      </div>
    </section>

    <section className="login-panel">
      <div className="login-card-wrap">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Volver al portal</Link>
        <div className="login-heading"><div className="login-mobile-mark"><Activity size={21} /></div><span className="login-eyebrow">PORTAL DEL ESTUDIANTE</span><h2>Qué bueno verte.</h2><p>Ingresa a tu cuenta para continuar.</p></div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Correo electrónico</label>
          <div className="input-wrap"><Mail size={18} /><input id="email" name="email" type="email" placeholder="nombre@correo.com" autoComplete="email" required /></div>

          <div className="password-label"><label htmlFor="password">Contraseña</label><button type="button" className="forgot-link" onClick={() => setMessage("Solicita el restablecimiento de tu contraseña a tu academia.")}>¿Olvidaste tu contraseña?</button></div>
          <div className="input-wrap"><LockKeyhole size={18} /><input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Ingresa tu contraseña" autoComplete="current-password" required minLength={6} /><button className="reveal-button" type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

          <label className="remember-option"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span className="custom-check" />Recordarme en este dispositivo</label>
          <button className="button button-primary login-submit" type="submit">Ingresar a mi cuenta <ArrowRight size={17} /></button>
          {message && <p className="login-message" role="status">{message}</p>}
        </form>

        <div className="login-divider"><span /> <small>ACCESO SEGURO</small> <span /></div>
        <div className="secure-note"><ShieldCheck size={17} /><span>Tus datos están protegidos y solo los verá tu academia.</span></div>
        <p className="login-help">¿Aún no tienes acceso? <button onClick={() => setMessage("Comunícate con la administración de tu academia para activar tu cuenta.")}>Pide ayuda a tu academia</button></p>
      </div>
      <p className="login-copyright">© 2026 SpinAcademy <span>·</span> Hecho para seguir mejorando</p>
    </section>
  </main>;
}
