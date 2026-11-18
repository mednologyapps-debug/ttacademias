"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";

export default function PasswordRecoveryForm() {
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get("token") || ""); }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/recovery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(token ? { token, password: form.get("password") } : { email: form.get("email") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "No se pudo procesar la solicitud.");
      setSent(true); setMessage(result.message); if (token) window.setTimeout(() => window.location.assign("/login"), 1600);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo procesar la solicitud."); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <section className="auth-card recovery-card">
      <Link href="/login" className="back-link"><ArrowLeft size={16} /> Volver al inicio de sesión</Link>
      <div className="recovery-mark"><ShieldCheck size={22} /></div>
      <div className="login-heading"><span className="login-eyebrow">RECUPERAR ACCESO</span><h2>{token ? "Elige una contraseña nueva." : "Restablece tu contraseña."}</h2><p>{token ? "Crea una contraseña segura para volver a tu cuenta." : "Te enviaremos un enlace al correo asociado a tu cuenta."}</p></div>
      <form className="login-form" onSubmit={handleSubmit}>
        {token ? <><label htmlFor="newPassword">Nueva contraseña</label><div className="input-wrap"><ShieldCheck size={18} /><input id="newPassword" name="password" type="password" minLength={10} autoComplete="new-password" placeholder="Mínimo 10 caracteres" required /></div></> : <><label htmlFor="recoveryEmail">Correo electrónico</label><div className="input-wrap"><Mail size={18} /><input id="recoveryEmail" name="email" type="email" placeholder="nombre@correo.com" autoComplete="email" required /></div></>}
        <button className="button button-primary login-submit" type="submit" disabled={busy}>{busy ? "Procesando…" : token ? "Actualizar contraseña" : "Enviar enlace"} {!busy && <ArrowRight size={17} />}</button>
      </form>
      {sent && <p className="login-message" role="status">{message}</p>}{message && !sent && <p className="login-message" role="status">{message}</p>}
    </section>
  </main>;
}
