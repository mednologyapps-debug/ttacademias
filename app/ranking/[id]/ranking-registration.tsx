"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {CalendarDays,MapPin,Users} from "lucide-react";
import {useStandings} from "@/components/academy-standings";

export default function RankingRegistration({rankingId,embedded=false}:{rankingId:string;embedded?:boolean}){
  const {result,error}=useStandings();
  const ranking=result?.open.find(r=>r.id===rankingId);
  const [dni,setDni]=useState(""),[name,setName]=useState("");
  const [quote,setQuote]=useState<{price:number;kind:string}|null>(null);
  const [done,setDone]=useState<string>(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
  async function submit(e:FormEvent){
    e.preventDefault();if(busy)return;setBusy(true);setNotice("");
    try{
      const response=await fetch("/api/public/rankings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:rankingId,dni,name,submit:!!quote,expectedPrice:quote?.price})});
      const body=await response.json();
      if(!response.ok)throw Error(body.error);
      if(quote)setDone(body.confirmed?"Tu cupo quedó confirmado.":"La academia recibió tu inscripción. Coordina el pago con la sede para confirmar tu cupo.");
      else setQuote(body);
    }catch(e){setNotice(e instanceof Error?e.message:"No se pudo registrar la inscripción.");}
    finally{setBusy(false);}
  }
  const Page=embedded?"div":"main";
  return <Page className={embedded?"embedded-ranking":"ranking-public-page"}>{!embedded&&<Link href="/rankings" className="back-link">Volver a rankings</Link>}
    {done?<section className="ranking-public-card"><h1>Inscripción registrada</h1><p>{done}</p><Link href="/rankings">Ver rankings</Link></section>
    :!ranking?<section className="ranking-public-card"><h2>{error?"No se pudo cargar el ranking":result?"Inscripciones cerradas":"Cargando ranking…"}</h2></section>
    :<section className="ranking-public-shell"><div className="ranking-public-intro"><h1>{ranking.title}</h1><div className="ranking-public-facts">
      <span><CalendarDays/>{new Date(ranking.date+"T12:00:00").toLocaleDateString("es-PE")} · {ranking.time}</span><span><MapPin/>{ranking.venue}</span><span><Users/>{ranking.capacity-ranking.entries} cupos disponibles</span>
    </div><p>Alumno S/ {ranking.studentPrice.toFixed(2)} · Externo S/ {ranking.publicPrice.toFixed(2)}</p></div>
    <div className="ranking-public-form-wrap"><form onSubmit={submit} className="ranking-public-form"><h2>{quote?"Confirma tu inscripción":"Inscríbete al ranking"}</h2>
    {quote?<><p>{name} · DNI {dni}</p><div className="ranking-public-price"><span>Tarifa {quote.kind.toLowerCase()}</span><strong>S/ {quote.price.toFixed(2)}</strong></div>{quote.price>0&&<p>El pago se confirma con la academia.</p>}</>
    :<><label>Nombre y apellido<input required maxLength={160} value={name} onChange={e=>setName(e.target.value)}/></label><label>DNI<input required inputMode="numeric" pattern="[0-9]{8}" maxLength={8} value={dni} onChange={e=>setDni(e.target.value.replace(/\D/g,""))}/></label></>}
    {notice&&<p role="alert">{notice}</p>}<button className="ranking-public-primary" disabled={busy||ranking.entries>=ranking.capacity}>{busy?"Guardando…":ranking.entries>=ranking.capacity?"Aforo completo":quote?"Confirmar inscripción":"Ver mi tarifa"}</button>
    {quote&&<button type="button" className="ranking-public-back" disabled={busy} onClick={()=>setQuote(null)}>Editar datos</button>}</form></div></section>}
  </Page>;
}
