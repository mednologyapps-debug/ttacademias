export type Player = { id:string; name:string; dni?:string; paid:boolean; receipt?:{cents:number;date:string}; group?:number; weight:number; kind:"Alumno"|"Externo" };
export type EventInfo = { id:string; title:string; date:string; time:string; venue:string; capacity:number; studentPrice:number; publicPrice:number; participants:Player[] };
export type SetScore = [number,number];
export type Game = { id:string; a:string|null; b:string|null; sets:SetScore[] };
export type Tournament = { event:EventInfo; phase:"open"|"withdrawn"|"confirmed"|"groups"|"bracket"|"closed"; bestOf:3|5|7; groupGames:Game[]; rounds:Game[][] };
export type Move = {kind:"save";event:EventInfo} | {kind:"withdraw"} | {kind:"confirm";event:EventInfo} | {kind:"start";bestOf:3|5|7} | {kind:"score";game:string;sets:SetScore[]} | {kind:"draw"} | {kind:"swap";from:number;to:number} | {kind:"close"};
function requireThat(condition:unknown,message:string):asserts condition { if(!condition) throw new Error(message); }
export const groupsOf = (t:Tournament) => [...new Set(t.event.participants.filter(p=>p.paid).map(p=>p.group!))].sort((a,b)=>a-b);
export function winner(g:Game) {
  if(!g.a || !g.b) return g.a || g.b;
  if(!g.sets.length) return null;
  return g.sets.filter(([a,b])=>a>b).length > g.sets.length/2 ? g.a : g.b;
}
export function validateSets(sets:SetScore[],bestOf:number) {
  const target=(bestOf+1)/2; let aWins=0,bWins=0;
  requireThat(Array.isArray(sets) && sets.length<=bestOf,"Revisa la cantidad de sets.");
  for(const set of sets) {
    requireThat(Array.isArray(set) && set.length===2 && set.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=999),"Ingresa ambos puntajes de cada set.");
    const [a,b]=set, high=Math.max(a,b), low=Math.min(a,b);
    requireThat(aWins<target && bWins<target,"El partido ya tenía un ganador antes del último set.");
    requireThat(high===11 && low<=9 || high>11 && high-low===2,"Cada set se gana a 11, con dos puntos de ventaja.");
    if(a>b) aWins++; else bWins++;
  }
  requireThat(Math.max(aWins,bWins)===target,"Completa los sets necesarios para definir un ganador.");
}
export function standings(t:Tournament,group?:number) {
  const games=group===undefined ? [...t.groupGames,...t.rounds.flat()] : t.groupGames;
  const rows=t.event.participants.filter(p=>p.paid && (group===undefined || p.group===group)).map(p=>{
    let points=0, diff=0,played=0;
    const scores:string[]=[];
    for(const g of games) {
      if(!g.sets.length || (g.a!==p.id && g.b!==p.id)) continue;
      played++; if(winner(g)===p.id) points++;
      const sets=g.sets.map(([a,b])=>g.a===p.id ? [a,b] : [b,a]);
      diff+=sets.reduce((n,[a,b])=>n+a-b,0);
      scores.push(sets.map(([a,b])=>a+"–"+b).join(" / "));
    }
    return {player:p,points,diff,played,scores};
  });
  return rows.some(r=>r.played)?rows.sort((a,b)=>b.points-a.points || b.diff-a.diff || a.player.weight-b.player.weight):rows;
}
function firstRound(t:Tournament):Game[] {
  const qualified=groupsOf(t).map(g=>standings(t,g).slice(0,2).map(r=>r.player.id));
  const n=qualified.length;
  const pairs=qualified.map(([first],i)=>{
    // For an odd count the final three groups use a cyclic crossover.
    const other=n===1 ? 0 : n%2===1 && i>=n-3 ? n-3+(i-(n-3)+1)%3 : i%2===0 ? i+1 : i-1;
    return [first,qualified[other][1]];
  });
  // Place reciprocal crossovers in opposite halves.
  const ordered=[...pairs.filter((_,i)=>i%2===0),...pairs.filter((_,i)=>i%2===1)];
  const size=2**Math.ceil(Math.log2(ordered.length));
  const slots:(string|null)[][]=[];
  ordered.forEach((pair,i)=>{ if(i<size-ordered.length) slots.push([pair[0],null],[null,pair[1]]); else slots.push(pair); });
  return slots.map(([a,b],i)=>({id:"k0-"+i,a,b,sets:[]}));
}
function advance(t:Tournament) {
  const r=t.rounds.at(-1)!;
  if(r.length===1 || r.some(g=>!winner(g))) return;
  const next:Game[]=[];
  for(let i=0;i<r.length;i+=2) next.push({id:"k"+t.rounds.length+"-"+i/2,a:winner(r[i]),b:winner(r[i+1]),sets:[]});
  t.rounds.push(next);
}
export function transition(current:Tournament|null, action:Move):Tournament {
  if(action.kind==="save") {
    requireThat(!current || current.phase==="open","Las inscripciones están cerradas.");
    const e=action.event;
    requireThat(e && /^[\w-]{1,100}$/.test(e.id) && (!current || e.id===current.event.id),"Identificador inválido.");
    requireThat(typeof e.title==="string" && e.title.trim() && e.title.length<=180 && typeof e.venue==="string" && e.venue.trim() && e.venue.length<=200,"Revisa el nombre y la sede.");
    requireThat(/^\d{4}-\d{2}-\d{2}$/.test(e.date) && Number.isFinite(Date.parse(e.date)) && /^(1[0-2]|[1-9]):[0-5]\d [AP]M$/.test(e.time),"Revisa la fecha y hora.");
    requireThat([e.studentPrice,e.publicPrice].every(n=>Number.isFinite(n)&&n>=0) && Number.isInteger(e.capacity) && e.capacity>=2 && e.capacity<=200,"Revisa los precios y el aforo.");
    requireThat(Array.isArray(e.participants) && e.participants.length<=e.capacity,"Aforo completo.");
    requireThat(e.participants.every(p=>p && typeof p.name==="string" && p.name.trim() && p.name.length<=160 && typeof p.id==="string" && p.id && (!p.dni || /^\d{8}$/.test(p.dni)) && ["Alumno","Externo"].includes(p.kind) && typeof p.paid==="boolean" && Number.isInteger(p.weight) && p.weight>=1 && p.weight<=5 && (!p.group || Number.isInteger(p.group) && p.group>0 && p.group<=100)),"Participante inválido.");
    const ids=e.participants.map(p=>p.id), docs=e.participants.map(p=>p.dni).filter(Boolean);
    requireThat(new Set(ids).size===ids.length && new Set(docs).size===docs.length,"Ya existe un participante con ese DNI.");
    const prior=new Map(current?.event.participants.map(p=>[p.id,p])||[]);
    const participants=e.participants.map(p=>{
      const previous=prior.get(p.id);
      requireThat(!previous?.paid || p.paid,"El pago de este participante ya fue confirmado.");
      const receipt=previous?.receipt || (p.paid?{date:new Date().toLocaleDateString("sv-SE",{timeZone:"America/Lima"}),cents:Math.round((p.kind==="Alumno"?e.studentPrice:e.publicPrice)*100)}:undefined);
      return {...p,receipt};
    });
    requireThat(!current?.event.participants.some(p=>p.paid && !ids.includes(p.id)),"Hay participantes con pago confirmado.");
    return {event:{...e,participants},phase:"open",bestOf:3,groupGames:[],rounds:[]};
  }
  if(action.kind==="withdraw") {
    requireThat(current?.phase==="open" && !current.event.participants.length,"Solo se puede eliminar un ranking sin participantes.");
    return {...current,phase:"withdrawn"};
  }
  if(action.kind==="confirm") {
    requireThat(!current || current.phase==="open","El ranking ya se inició.");
    const e=current?.event || action.event;
    requireThat(e && typeof e.title==="string" && Array.isArray(e.participants) && e.participants.length<=512,"Datos del torneo inválidos.");
    const players=e.participants.filter(p=>p.paid);
    requireThat(players.length>=2 && players.every(p=>typeof p.id==="string" && p.id && typeof p.name==="string" && p.name.trim() && Number.isInteger(p.group) && p.group!>0),"Genera los grupos de todos los participantes con pago confirmado.");
    requireThat(new Set(players.map(p=>p.id)).size===players.length,"Hay participantes duplicados.");
    const documents=players.map(p=>p.dni).filter(Boolean);
    requireThat(new Set(documents).size===documents.length,"Un DNI solo puede competir una vez por ranking.");
    const t:Tournament={event:e,phase:"confirmed",bestOf:3,groupGames:[],rounds:[]};
    for(const group of groupsOf(t)) {
      const ps=players.filter(p=>p.group===group);
      requireThat(ps.length>=2 && ps.length<=5,"Cada grupo requiere entre dos y cinco jugadores.");
      ps.forEach((a,i)=>ps.slice(i+1).forEach(b=>t.groupGames.push({id:"g"+t.groupGames.length,a:a.id,b:b.id,sets:[]})));
    }
    return t;
  }
  requireThat(current && !["open","withdrawn","closed"].includes(current.phase),"El ranking está cerrado o aún no se inició.");
  const t=structuredClone(current);
  if(action.kind==="start") {
    requireThat(t.phase==="confirmed","Confirma los grupos antes de iniciar el ranking.");
    requireThat([3,5,7].includes(action.bestOf),"Formato de partido inválido.");
    t.phase="groups"; t.bestOf=action.bestOf; return t;
  }
  requireThat(t.phase!=="confirmed","Inicia el ranking antes de registrar resultados.");
  if(action.kind==="score") {
    const games=t.phase==="groups" ? t.groupGames : t.rounds.at(-1)!;
    const game=games.find(g=>g.id===action.game);
    requireThat(game?.a && game.b,"Solo puedes puntuar un partido de la fase actual con dos jugadores.");
    validateSets(action.sets,t.bestOf); game.sets=action.sets;
    if(t.phase==="bracket") advance(t);
  } else if(action.kind==="draw") {
    requireThat(t.phase==="groups" && t.groupGames.every(g=>g.sets.length),"Completa los partidos de todos los grupos.");
    t.rounds=[firstRound(t)]; t.phase="bracket";
  } else if(action.kind==="swap") {
    const r=t.rounds[0];
    requireThat(t.phase==="bracket" && t.rounds.length===1 && !r.some(g=>g.sets.length),"Solo puedes mover jugadores antes del primer resultado de llaves.");
    const slots=r.flatMap(g=>[g.a,g.b]);
    requireThat([action.from,action.to].every(i=>Number.isInteger(i) && i>=0 && i<slots.length),"Posición inválida.");
    [slots[action.from],slots[action.to]]=[slots[action.to],slots[action.from]];
    r.forEach((g,i)=>{g.a=slots[2*i];g.b=slots[2*i+1];requireThat(g.a || g.b,"Un cruce no puede tener dos pases libres.");});
  } else if(action.kind==="close") {
    const last=t.rounds.at(-1);
    requireThat(t.phase==="bracket" && last?.length===1 && last[0].sets.length,"Registra el resultado de la final.");
    t.phase="closed";
  } else throw new Error("Acción desconocida.");
  return t;
}
export function academyTable(events:Tournament[]) {
  const rows=new Map<string,{name:string;points:number;diff:number;events:number}>();
  for(const t of events.filter(t=>t.phase==="closed")) for(const s of standings(t)) {
    const key=s.player.dni || s.player.id;
    const row=rows.get(key) || {name:s.player.name,points:0,diff:0,events:0};
    row.points+=s.points; row.diff+=s.diff; row.events++;rows.set(key,row);
  }
  return [...rows.values()].sort((a,b)=>b.points-a.points || b.diff-a.diff || a.name.localeCompare(b.name,"es"));
}

export function arrangePlayers(players:Player[], source:string, target:{player:string}|{group:number}):Player[] {
  const next=players.map(p=>({...p}));
  const from=next.findIndex(p=>p.id===source && p.paid && p.group);
  requireThat(from!==-1,"Selecciona un jugador del grupo.");
  if("player" in target) {
    const to=next.findIndex(p=>p.id===target.player && p.paid && p.group);
    requireThat(to!==-1,"Selecciona el jugador que cambiará de posición.");
    [next[from].group,next[to].group]=[next[to].group,next[from].group];
    [next[from],next[to]]=[next[to],next[from]];
  } else {
    requireThat(next.some(p=>p.paid && p.group===target.group),"Grupo desconocido.");
    if(next[from].group===target.group)return players;
    requireThat(next.filter(p=>p.paid && p.group===target.group).length<5,"El grupo está lleno. Selecciona un jugador para intercambiar posiciones.");
    requireThat(next.filter(p=>p.paid && p.group===next[from].group).length>1,"Para conservar el grupo, intercambia a su último jugador por otro.");
    const member=next.splice(from,1)[0];
    member.group=target.group;
    next.push(member);
  }
  return next;
}

export function publicGroups(t:Tournament) {
  return {id:t.event.id,title:t.event.title,groups:groupsOf(t).map(number=>({
    number,players:t.event.participants.filter(p=>p.paid && p.group===number).map(p=>p.name)
  }))};
}
export function groupLabel(n:number):string {
  return (n>26?groupLabel(Math.floor((n-1)/26)):"")+String.fromCharCode(65+(n-1)%26);
}
