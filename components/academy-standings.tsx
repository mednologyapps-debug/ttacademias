"use client";
import {useEffect,useState} from "react";
type Row={name:string;points:number;events:number;diff:number};
export function useStandings() {
  const [result,setResult]=useState<{table:Row[];started:string[]}|null>(null);
  const [error,setError]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    async function refresh(){try {
      const res=await fetch("/api/public/standings",{cache:"no-store",signal:controller.signal});
      if(!res.ok)throw Error();setResult(await res.json());setError(false);
    }catch{if(!controller.signal.aborted)setError(true);}}
    void refresh();window.addEventListener("focus",refresh);
    return ()=>{controller.abort();window.removeEventListener("focus",refresh);};
  },[]);
  return {result,error};
}
export function StandingsTable({rows,error=false}:{rows?:Row[];error?:boolean}){
  return <section className="card standings-card" style={{padding:"1.25rem",marginBlock:"1rem"}}><h2>Tabla de la academia</h2>
    {error?<p role="status">No se pudo consultar la clasificación.</p>:!rows?<div className="skeleton" style={{height:80}}/>:rows.length?
      rows.map((r,i)=><div className="standing-row" key={i}><span className="rank-circle">{i+1}</span><strong>{r.name}</strong><div className="standing-points"><b>{r.points}</b><span>puntos</span></div></div>)
      :<p>Los puntos aparecerán al cerrar el primer ranking.</p>}</section>;
}
