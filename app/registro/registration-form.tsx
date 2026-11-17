"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";

export default function RegistrationForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    setMessage("El registro quedará listo cuando conectemos la autenticación de la academia.");
  }

  return <main className="auth-page">
    <section className="auth-card">
      <Link href="/login" className="back-link"><ArrowLeft size={16} /> Volver al inicio de sesión</Link>
      <Link href="/" className="brand auth-brand"><span className="brand-mark"><Activity size={20} /></span><span>Spin<span className="brand-light">Academy</span></span></Link>
      <div className="login-heading"><span className="login-eyebrow">NUEVA CUENTA</span><h2>Empieza a entrenar.</h2><p>Crea tu cuenta de estudiante para entrar a tu academia.</p></div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="fullName">Nombre completo</label>
        <div className="input-wrap"><UserRound size={18} /><input id="fullName" name="fullName" type="text" placeholder="Tu nombre y apellido" autoComplete="name" required /></div>
        <label htmlFor="registerEmail">Correo electrónico</label>
        <div className="input-wrap"><Mail size={18} /><input id="registerEmail" name="email" type="email" placeholder="nombre@correo.com" autoComplete="email" required /></div>
        <label htmlFor="registerPassword">Contraseña</label>
        <div className="input-wrap"><LockKeyhole size={18} /><input id="registerPassword" name="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" autoComplete="new-password" minLength={8} required /><button className="reveal-button" type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        <label htmlFor="confirmPassword">Confirma tu contraseña</label>
        <div className="input-wrap"><LockKeyhole size={18} /><input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Repite tu contraseña" autoComplete="new-password" minLength={8} required /></div>
        <button className="button button-primary login-submit" type="submit">Crear cuenta <ArrowRight size={17} /></button>
        {message && <p className="login-message" role="status">{message}</p>}
      </form>
      <div className="login-divider"><span /><small>O REGÍSTRATE CON</small><span /></div>
      <button className="google-button" type="button" onClick={() => setMessage("El registro con Google se activará al configurar la autenticación de la academia.")}><span className="google-g">G</span>Crear cuenta con Google</button>
      <p className="login-help">¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link></p>
    </section>
  </main>;
}
