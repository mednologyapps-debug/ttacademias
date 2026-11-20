"use client";
import {useState,type FormEvent} from "react";
import GroupBoard from "./group-board";
import Modal from "@/components/modal";
import {groupLabel,groupsOf,standings,winner,validateSets,type Tournament,type Game,type Move,type EventInfo} from "@/lib/tournament";
import "./competition.css";

type Props={event:EventInfo;t?:Tournament;onMove:(action:Move)=>Promise<boolean>;busy:boolean};
function roundName(n:number) {return ({1:"Final",2:"Semifinales",4:"Cuartos de final",8:"Octavos de final",16:"Dieciseisavos de final"} as Record<number,string>)[n] || "Ronda de "+(2*n);}
export default function TournamentPanel({event,t,onMove,busy}:Props) {
  const [format,setFormat]=useState<3|5|7>(3);
  const [group,setGroup]=useState(1);
  const [editing,setEditing]=useState<Game|null>(null);
  const [drag,setDrag]=useState<number|null>(null);
  const [swap,setSwap]=useState<number|null>(null);
  const name=(id:string|null)=>t?.event.participants.find(p=>p.id===id)?.name || "Pase libre";
  const paid=event.participants.filter(p=>p.paid);
  if(!t) return <div className="ops-card phase-actions"><p>Confirma la distribución para habilitar el inicio del torneo.</p>
    <button className="admin-primary-button" disabled={busy || paid.length<2 || paid.some(p=>!p.group)} onClick={()=>onMove({kind:"confirm",event})}>Confirmar grupos</button>
    <button disabled className="admin-secondary-button">Iniciar ranking</button></div>;
  if(t.phase==="confirmed")return <section className="ops-card group-editor"><header className="sheet-heading"><div><h2>Grupos confirmados</h2><p>{t.event.participants.filter(p=>p.paid).length} jugadores en {groupsOf(t).length} grupos</p></div></header>
    <GroupBoard players={t.event.participants}/><div className="ops-controls phase-actions"><label>Formato de partidos<select value={format} onChange={e=>setFormat(Number(e.target.value) as 3|5|7)}>{[3,5,7].map(n=><option key={n} value={n}>Al mejor de {n} sets</option>)}</select></label>
    <button className="admin-primary-button" disabled={busy} onClick={()=>onMove({kind:"start",bestOf:format})}>Iniciar ranking</button></div></section>;
  const groups=groupsOf(t);
  const active=groups.includes(group)?group:groups[0];
  const board=standings(t,active);
  const games=t.groupGames.filter(g=>board.some(r=>r.player.id===g.a));
  const round=t.rounds.at(-1);
  const movable=t.phase==="bracket" && t.rounds.length===1 && !round!.some(g=>g.sets.length);
  const result=(g:Game,editable:boolean)=><button type="button" className="ops-score" disabled={busy || !editable || !g.a || !g.b} onClick={()=>setEditing(g)}>
    {g.sets.length?g.sets.map(s=>s.join("–")).join(" / "):!g.a || !g.b?"Pase libre":"Anotar sets"}</button>;
  return <div className="ops-stack"><section className="ops-card tournament-scoreboard">
    <header className="sheet-heading"><div><h2>Fase de grupos</h2><p>Clasifican los dos primeros de cada grupo.</p></div><span className="ledger-chip">{t.groupGames.filter(g=>g.sets.length).length} / {t.groupGames.length} partidos</span></header>
    <div className="stage-tabs">{groups.map(g=><button type="button" key={g} aria-pressed={active===g} onClick={()=>setGroup(g)}>Grupo {groupLabel(g)}</button>)}</div>
    <div className="stage-columns"><div className="stage-standings"><h3>Posiciones del grupo {groupLabel(active)}</h3><div className="ops-scroll"><table><thead><tr><th>Jugador</th><th>Sets por partido</th><th>Dif.</th><th>Puntos</th></tr></thead><tbody>
    {board.map((r,i)=><tr key={r.player.id}><td>{i+1}. {r.player.name}</td><td>{!r.scores.length && "—"}{r.scores.map((s,j)=><span className="ops-set" key={j}>{s}</span>)}</td><td>{r.diff}</td><td><strong>{r.points}</strong></td></tr>)}</tbody></table></div>
    <p className="stage-note">Victoria 1 · Derrota 0 · Desempate por diferencia de tantos y luego por siembra.</p></div><div className="stage-matches"><h3>Encuentros</h3>{games.map(g=><div className="ops-match" key={g.id}><span>{name(g.a)} <small>vs.</small> {name(g.b)}</span>{result(g,t.phase==="groups")}</div>)}</div></div>
    {t.phase==="groups" && <div className="ops-controls"><button className="admin-primary-button" disabled={busy||!t.groupGames.every(g=>g.sets.length)} onClick={()=>onMove({kind:"draw"})}>Sortear llaves</button></div>}
  </section>
  {!!round && <section className="ops-card"><h2>Llaves de eliminación</h2>{movable && <p>Arrastra un jugador a otra posición o toca dos posiciones para intercambiarlas.</p>}
    <div className="ops-bracket">{t.rounds.map((r,i)=><div key={i}><h3>{roundName(r.length)}</h3>{r.map((g,j)=><article key={g.id}>
      {[g.a,g.b].map((id,k)=>{const pos=j*2+k;return <button key={k} type="button" className="ops-slot" disabled={!movable||busy} aria-pressed={movable && swap===pos}
        draggable={movable && !busy} onDragStart={e=>{e.dataTransfer.setData("text/plain",String(pos));setDrag(pos);}} onDragEnd={()=>setDrag(null)}
        onDragOver={e=>{if(movable)e.preventDefault();}} onDrop={e=>{e.preventDefault();if(drag!==null && drag!==pos) void onMove({kind:"swap",from:drag,to:pos});setDrag(null);setSwap(null);}}
        onClick={()=>{if(swap!==null && swap!==pos)void onMove({kind:"swap",from:swap,to:pos});setSwap(swap===null?pos:null);}}>{name(id)}</button>;})}
      {result(g,t.phase==="bracket"&&i===t.rounds.length-1)}</article>)}</div>)}</div>
    {round.length===1 && winner(round[0]) && <div className="ops-controls"><strong>Campeón · {name(winner(round[0]))}</strong>{t.phase==="closed"?<span>Ranking cerrado</span>:<button disabled={busy} className="admin-primary-button" onClick={()=>onMove({kind:"close"})}>Cerrar ranking</button>}</div>}
  </section>}
  {t.phase==="closed" && <section className="ops-card"><h2>Puntos asignados</h2>{standings(t).map(r=><div key={r.player.id} className="ops-match"><span>{r.player.name}</span><strong>{r.points} pts.</strong></div>)}</section>}
  {editing && <ScoreForm game={editing} a={name(editing.a)} b={name(editing.b)} bestOf={t.bestOf} busy={busy} close={()=>setEditing(null)} save={async sets=>{const ok=await onMove({kind:"score",game:editing.id,sets});if(ok)setEditing(null);return ok;}}/>}
  </div>;
}
function ScoreForm({game,a,b,bestOf,busy,close,save}:{game:Game;a:string;b:string;bestOf:number;busy:boolean;close:()=>void;save:(s:[number,number][])=>Promise<boolean>}) {
  const [draft,setDraft]=useState(()=>Array.from({length:bestOf},(_,i)=>[String(game.sets[i]?.[0]??""),String(game.sets[i]?.[1]??"")]));
  const [error,setError]=useState("");
  async function submit(e:FormEvent){e.preventDefault(); const last=draft.findLastIndex(s=>s.some(Boolean));
    const used=draft.slice(0,last+1);if(!used.length || used.some(s=>s.some(v=>!v))){setError("Completa los dos puntajes de cada set jugado.");return;}
    const sets=used.map(([x,y]):[number,number]=>[Number(x),Number(y)]);
    try {validateSets(sets,bestOf);} catch(problem){setError((problem as Error).message);return;}
    if(!await save(sets))setError("No se guardó el resultado. Revisa el estado del partido y vuelve a intentarlo.");}
  return <Modal className="admin-form-modal" labelledBy="score-title" onDismiss={close}><h2 id="score-title">Resultado del partido</h2>
    <form onSubmit={submit}><div className="ops-scroll"><table><thead><tr><th>Set</th><th>{a}</th><th>{b}</th></tr></thead><tbody>{draft.map((set,i)=><tr key={i}><td>{i+1}</td>{set.map((v,k)=><td key={k}><input aria-label={`Set ${i+1}, ${k===0?a:b}`} type="number" min="0" max="999" step="1" value={v} onChange={e=>setDraft(draft.map((s,n)=>n===i?s.map((old,j)=>j===k?e.target.value:old):s))}/></td>)}</tr>)}</tbody></table></div><p>Deja vacíos los sets que no se jugaron.</p>{error&&<p role="alert">{error}</p>}
    <div className="ops-controls"><button type="button" onClick={close}>Volver</button><button disabled={busy} className="admin-primary-button">Guardar resultado</button></div></form></Modal>;
}
