"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import AcademyBrand from "@/components/academy-brand";

export default function RegistrationForm({ embedded = false }: { embedded?: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    const form = new FormData(event.currentTarget); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: form.get("fullName"), email: form.get("email"), password: form.get("password"), dni: form.get("dni"), phone: form.get("phone") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo crear la cuenta.");
      window.location.assign(result.redirect || "/");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo crear la cuenta."); }
    finally { setBusy(false); }
  }

  const Page = embedded ? "div" : "main";
  return <Page className={embedded ? "public-enrollment" : "auth-page"}>
    <section className={embedded ? undefined : "auth-card"}>
      {!embedded && <>
      <Link href="/login" className="back-link"><ArrowLeft size={16} /> Volver al inicio de sesión</Link>
      <Link href="/" className="brand auth-brand"><AcademyBrand /></Link>
      </>}
      <div className="login-heading"><h2>{embedded ? "Matricularme" : "Empieza a entrenar."}</h2><p>Crea tu cuenta de estudiante para entrar a tu academia.</p></div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="fullName">Nombre completo</label>
        <div className="input-wrap"><UserRound size={18} /><input id="fullName" name="fullName" type="text" placeholder="Tu nombre y apellido" autoComplete="name" required /></div>
        <label htmlFor="dni">DNI</label>
        <div className="input-wrap"><ShieldCheck size={18} /><input id="dni" name="dni" type="text" inputMode="numeric" pattern="[0-9]{8}" maxLength={8} placeholder="8 dígitos" required /></div>
        <label htmlFor="registerEmail">Correo electrónico</label>
        <div className="input-wrap"><Mail size={18} /><input id="registerEmail" name="email" type="email" placeholder="nombre@correo.com" autoComplete="email" required /></div>
        <label htmlFor="registerPassword">Contraseña</label>
        <div className="input-wrap"><LockKeyhole size={18} /><input id="registerPassword" name="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 10 caracteres" autoComplete="new-password" minLength={10} required /><button className="reveal-button" type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        <label htmlFor="confirmPassword">Confirma tu contraseña</label>
        <div className="input-wrap"><LockKeyhole size={18} /><input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Repite tu contraseña" autoComplete="new-password" minLength={10} required /></div>
        <button className="button button-primary login-submit" type="submit" disabled={busy}>{busy ? "Creando cuenta…" : "Crear cuenta"} {!busy && !embedded && <ArrowRight size={17} />}</button>
        {message && <p className="login-message" role="status">{message}</p>}
      </form>
      <div className="login-divider"><span /><small>O REGÍSTRATE CON</small><span /></div>
      <button className="google-button" type="button" onClick={() => setMessage("El registro con Google se activará al configurar la autenticación de la academia.")}><span className="google-g">G</span>Crear cuenta con Google</button>
      <p className="login-help">¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link></p>
    </section>
  </Page>;
}
