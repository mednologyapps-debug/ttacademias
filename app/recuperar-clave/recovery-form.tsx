"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";

export default function PasswordRecoveryForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return <main className="auth-page">
    <section className="auth-card recovery-card">
      <Link href="/login" className="back-link"><ArrowLeft size={16} /> Volver al inicio de sesión</Link>
      <div className="recovery-mark"><ShieldCheck size={22} /></div>
      <div className="login-heading"><span className="login-eyebrow">RECUPERAR ACCESO</span><h2>Restablece tu contraseña.</h2><p>Te enviaremos un enlace al correo asociado a tu cuenta.</p></div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="recoveryEmail">Correo electrónico</label>
        <div className="input-wrap"><Mail size={18} /><input id="recoveryEmail" name="email" type="email" placeholder="nombre@correo.com" autoComplete="email" required /></div>
        <button className="button button-primary login-submit" type="submit">Enviar enlace <ArrowRight size={17} /></button>
      </form>
      {sent && <p className="login-message" role="status">Si el correo pertenece a una cuenta, recibirás instrucciones para recuperar el acceso.</p>}
    </section>
  </main>;
}
