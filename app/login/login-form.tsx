"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password"), remember }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo iniciar sesión.");
      window.location.assign(result.redirect || "/");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión."); }
    finally { setBusy(false); }
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
        <div className="login-heading"><h2>Qué bueno verte.</h2><p>Ingresa a tu cuenta para continuar.</p></div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Usuario o correo electrónico</label>
          <div className="input-wrap"><Mail size={18} /><input id="username" name="username" type="text" placeholder="Usuario o correo" autoComplete="username" required /></div>

          <div className="password-label"><label htmlFor="password">Contraseña</label><Link href="/recuperar-clave" className="forgot-link">¿Olvidaste tu contraseña?</Link></div>
          <div className="input-wrap"><LockKeyhole size={18} /><input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Ingresa tu contraseña" autoComplete="current-password" required minLength={4} /><button className="reveal-button" type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

          <label className="remember-option"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span className="custom-check" />Recordarme en este dispositivo</label>
          <button className="button button-primary login-submit" type="submit" disabled={busy}>{busy ? "Ingresando…" : "Ingresar a mi cuenta"} {!busy && <ArrowRight size={17} />}</button>
          {message && <p className="login-message" role="status">{message}</p>}
        </form>

        {process.env.NODE_ENV !== "production" && <div className="local-demo-accounts"><strong>Cuentas de prueba local</strong><span>Admin: <b>testadmin</b> / <b>test</b></span><span>Estudiante: <b>testuser</b> / <b>test</b></span></div>}

        <div className="login-divider"><span /> <small>O CONTINÚA CON</small> <span /></div>
        <button className="google-button" type="button" onClick={() => setMessage("El acceso con Google requiere configurar las credenciales OAuth de producción.")}><span className="google-g">G</span>Continuar con Google</button>
        <p className="login-help">¿Primera vez aquí? <Link href="/registro">Crear cuenta</Link></p>
      </div>
      <p className="login-copyright">© 2026 SpinAcademy <span>·</span> Hecho para seguir mejorando</p>
    </section>
  </main>;
}
