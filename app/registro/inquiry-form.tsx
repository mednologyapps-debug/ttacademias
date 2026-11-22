"use client";
import {useState,type FormEvent} from "react";

export default function InquiryForm(){
  const [message,setMessage]=useState("");
  const [id,setId]=useState("");
  const [busy,setBusy]=useState(false);
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");
  async function send(event:FormEvent){
    event.preventDefault();
    if (busy || !message.trim()) return;
    setBusy(true); setError("");
    const requestId=id || crypto.randomUUID();setId(requestId);
    try {
      const res=await fetch("/api/public/inquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:requestId,message:message.trim()})});
      const data=await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar tu consulta.");
      setSent(true);
    } catch(e){setError(e instanceof Error?e.message:"No se pudo enviar la consulta.");}
    finally{setBusy(false);}
  }
  return <section className="enroll-form inquiry-form">{sent?<div role="status"><h2>Consulta recibida</h2><p>Tu mensaje quedó registrado en la academia.</p></div>:<>
    <h2>Solicitar información</h2><p>Pregúntanos por los próximos cursos. Incluye tu correo o celular en el mensaje si deseas que te respondamos.</p>
    <form onSubmit={send}><label>Tu mensaje<textarea required maxLength={2000} rows={5} value={message} onChange={e=>setMessage(e.target.value)} /></label>
    {error && <p role="alert">{error}</p>}<div className="enroll-actions"><button className="club-action" disabled={busy||!message.trim()}>{busy?"Enviando…":"Enviar"}</button></div></form></>}</section>;
}
