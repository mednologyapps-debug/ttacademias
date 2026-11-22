"use client";
import "./published-groups.css";
import {useEffect,useState} from "react";
import type {PublicRanking} from "@/lib/public-rankings";
type Row={name:string;points:number;events:number;diff:number};
type Competition={id:string;title:string;groups:{number:number;players:string[]}[]};
import {groupLabel} from "@/lib/tournament";
export function useStandings(groups=false) {
  const [result,setResult]=useState<{open:PublicRanking[];table:Row[];started:string[];competitions?:Competition[]}|null>(null);
  const [error,setError]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    async function refresh(){try {
      const res=await fetch("/api/public/standings"+(groups?"?groups=1":""),{cache:"no-store",signal:controller.signal});
      if(!res.ok)throw Error();setResult(await res.json());setError(false);
    }catch{if(!controller.signal.aborted)setError(true);}}
    void refresh();const timer=window.setInterval(()=>{if(!document.hidden)void refresh();},15000);window.addEventListener("focus",refresh);
    return ()=>{controller.abort();window.clearInterval(timer);window.removeEventListener("focus",refresh);};
  },[groups]);
  return {result,error};
}
export function StandingsTable({rows,error=false}:{rows?:Row[];error?:boolean}){
  return <section className="card standings-card" style={{padding:"1.25rem",marginBlock:"1rem"}}><h2>Tabla de la academia</h2>
    {error?<p role="status">No se pudo consultar la clasificación.</p>:!rows?<div className="skeleton" style={{height:80}}/>:rows.length?
      rows.map((r,i)=><div className="standing-row" key={i}><span className="rank-circle">{i+1}</span><strong>{r.name}</strong><div className="standing-points"><b>{r.points}</b><span>puntos</span></div></div>)
      :<p>Los puntos aparecerán al cerrar el primer ranking.</p>}</section>;
}

export function PublishedGroups({events}:{events?:Competition[]}){
  if(!events?.length)return null;
  return <section className="card published-groups"><h2>Grupos confirmados</h2>{events.map(e=><details key={e.id}><summary>{e.title}</summary>
    <div>{e.groups.map(g=><article key={g.number}><h3>Grupo {groupLabel(g.number)}</h3><ol>{g.players.map((p,i)=><li key={i}>{p}</li>)}</ol></article>)}</div>
  </details>)}</section>;
}
