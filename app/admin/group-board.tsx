"use client";
import {useState} from "react";
import {GripVertical, UsersRound} from "lucide-react";
import {arrangePlayers,groupLabel,type Player} from "@/lib/tournament";

export default function GroupBoard({players,onChange}:{players:Player[];onChange?:(players:Player[])=>void}) {
  const [selected,setSelected]=useState("");
  const [message,setMessage]=useState("");
  const assigned=players.filter(p=>p.paid && p.group);
  const count=Math.max(0,...assigned.map(p=>p.group!));
  function move(id:string,target:{player:string}|{group:number}) {
    if(!onChange || !id)return;
    try {onChange(arrangePlayers(players,id,target));setSelected("");setMessage("");}
    catch(e){setMessage((e as Error).message);}
  }
  return <div className="group-workspace">
    {onChange && <p>{selected?"Elige otro jugador para intercambiar posiciones o mueve el seleccionado a un grupo con cupo.":"Arrastra a un jugador sobre otro para intercambiarlos. También puedes tocar ambos nombres."}</p>}
    {message && <p role="alert">{message}</p>}
    <div className="group-board">{Array.from({length:count},(_,i)=>i+1).map(g=>{
      const members=assigned.filter(p=>p.group===g);
      return <article key={g} className="group-sheet" onDragOver={e=>{if(onChange)e.preventDefault();}}
        onDrop={e=>{e.preventDefault();move(e.dataTransfer.getData("text/plain"),{group:g});}}>
        <header><strong><UsersRound size={16}/> Grupo {groupLabel(g)}</strong><span>{members.length} / 5</span></header>
        <ol>{members.map((p,i)=><li key={p.id}>{onChange?<button type="button" draggable aria-pressed={selected===p.id}
          onDragStart={e=>{e.dataTransfer.setData("text/plain",p.id);setSelected(p.id);}}
          onDrop={e=>{e.preventDefault();e.stopPropagation();move(e.dataTransfer.getData("text/plain"),{player:p.id});}}
          onClick={()=>{if(selected && selected!==p.id)move(selected,{player:p.id});else setSelected(selected?"":p.id);}}>
          <span>{i+1}</span><b>{p.name}</b><GripVertical size={16}/></button>:<div><span>{i+1}</span><b>{p.name}</b></div>}</li>)}</ol>
        {onChange && members.length<5 && selected && !members.some(p=>p.id===selected) && <button className="group-transfer" onClick={()=>move(selected,{group:g})}>Mover aquí</button>}
      </article>;
    })}</div>
  </div>;
}
