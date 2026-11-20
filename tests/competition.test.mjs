import assert from "node:assert/strict";
import test from "node:test";
import { academyTable, standings, transition, validateSets, winner } from "../lib/tournament.ts";
import { courseTotals, validateFinance } from "../lib/course-finance.ts";

function event(groups) {
  const participants = Array.from({ length: groups * 3 }, (_, index) => ({
    id: String(index), name: "Jugador " + index, dni: String(10000000 + index),
    paid: true, group: Math.floor(index / 3) + 1, weight: index % 3 + 1, kind: "Alumno"
  }));
  return {id: "test", title: "Copa", participants, capacity: participants.length, date:"2026-11-20",time:"18:00",venue:"Sede",studentPrice:0,publicPrice:0};
}

const start = groups => transition(transition(null, { kind:"confirm", event:event(groups) }), {kind:"start",bestOf:3});
const score = (state, game, sets = [[11, 5], [11, 8]]) => transition(state, {kind: "score", game: game.id, sets});
function playGroups(state) {
  return state.groupGames.reduce((current, game) => score(current, game), state);
}

test("El puntaje decide los dos clasificados en un triple empate de victorias", () => {
  let t = start(1);
  assert.throws(() => transition(t, {kind: "draw"}));
  t = score(t, t.groupGames[0], [[11, 0], [11, 0]]);
  t = score(t, t.groupGames[1], [[10, 12], [10, 12]]);
  t = score(t, t.groupGames[2], [[11, 6], [11, 6]]);
  assert.deepEqual(standings(t, 1).map(r => [r.player.id,r.points,r.diff]), [["0",1,18],["2",1,-6],["1",1,-12]]);
  assert.deepEqual(academyTable([t]), []);
});

test("Sets sin empate, ventaja de dos y fin de partido al alcanzar la mayoría", () => {
  for (const invalid of [[[11, 11]], [[11, 10],[12, 10]], [[11, 0]], [[11, 4],[11, 8],[9, 11]]]) {
    assert.throws(() => validateSets(invalid,3));
  }
  validateSets([[19,17],[1,11],[11,9]],3);
  validateSets([[11,9],[11,9],[11,9]],5);
  validateSets([[11,9],[11,9],[11,9],[11,9]],7);
});

test("Cruces A1–B2 y B1–A2 en mitades distintas, con intercambio manual", () => {
  let t = transition(playGroups(start(4)), {kind:"draw"});
  const slots = () => t.rounds[0].map(g => [g.a,g.b]);
  assert.deepEqual(slots(), [["0","4"],["6","10"],["3","1"],["9","7"]]);
  t = transition(t,{kind:"swap",from:0,to:1});
  assert.deepEqual(slots()[0],["4","0"]);
  t = score(t,t.rounds[0][0]);
  assert.throws(() => transition(t,{kind:"swap",from:0,to:1}));
});

for (const groups of [1,2,3,4,5,7,8,16]) {
  test(groups + " grupos avanzan a la final sin duplicar puntos ni premiar pases libres", () => {
    let t=transition(playGroups(start(groups)), {kind:"draw"});
    const slots=t.rounds[0].flatMap(g=>[g.a,g.b]).filter(id=>id!==null);
    assert.equal(new Set(slots).size,groups*2);
    assert.equal(t.rounds[0].length,2 ** Math.ceil(Math.log2(groups)));
    assert.throws(()=>transition(t,{kind:"close"}));
    while (!winner(t.rounds.at(-1)[0]) || t.rounds.at(-1).length!==1) {
      const games=t.rounds.at(-1).filter(g=>g.a && g.b && !g.sets.length);
      assert.ok(games.length);
      for(const g of games)t=score(t,g);
    }
    t=transition(t,{kind:"close"});
    assert.throws(()=>transition(t,{kind:"close"}));
    assert.throws(()=>score(t,t.rounds.at(-1)[0]));
    const table=academyTable([t]);
    assert.equal(table.length,3*groups);
    assert.equal(table.reduce((n,r)=>n+r.points,0),t.groupGames.length+2*groups-1);
    assert.deepEqual(academyTable([JSON.parse(JSON.stringify(t))]),table);
    const next=structuredClone(t);
    next.event.id="next";
    assert.deepEqual(academyTable([t,next]).map(r=>r.points),table.map(r=>2*r.points));
  });
}
test("Dos cursos con roles y tarifas distintas cuentan solo cobros registrados", () => {
  const course={id:"base",name:"Básico",teachers:["Ana","Luis"],students:["Jugador"],price:"500",starts:"2026-11-01",ends:"2026-12-31",level:"Básico",slots:[]};
  const f={courses:[course,{...course,id:"comp",name:"Competencia",teachers:["Ana"]}],teachers:["Ana","Luis"].map(n=>[n,"","","","",""]),
    contracts:[{courseId:"base",teacher:"Ana",role:"Principal",cents:12500},{courseId:"base",teacher:"Luis",role:"De apoyo",cents:7500},{courseId:"comp",teacher:"Ana",role:"De apoyo",cents:5000}],
    receipts:[{id:"cobro",courseId:"base",student:"Jugador",cents:30000,date:"2026-11-20"}]};
  validateFinance(f);
  assert.deepEqual(courseTotals(f,"base"),{income:30000,fees:20000,balance:10000});
  assert.deepEqual(courseTotals(f,"comp"),{income:0,fees:5000,balance:-5000});
  assert.throws(()=>validateFinance({...f,contracts:[...f.contracts,f.contracts[0]]}));
});

test("La confirmación fija la composición y precede al inicio y a los resultados",async()=>{
  const {arrangePlayers}=await import("../lib/tournament.ts");
  const e=event(2);
  const original=e.participants;
  e.participants=arrangePlayers(original,"0",{player:"3"});
  assert.deepEqual(e.participants.filter(p=>p.group===2).map(p=>p.id),["0","4","5"]);
  assert.equal(original[0].group,1);
  assert.throws(()=>transition(null,{kind:"start",bestOf:3,event:e}));
  const fixed=transition(null,{kind:"confirm",event:e});
  assert.equal(fixed.phase,"confirmed");
  assert.throws(()=>transition(fixed,{kind:"score",game:"g0",sets:[[11,0],[11,0]]}));
  assert.throws(()=>transition(fixed,{kind:"confirm",event:e}));
  const playing=transition(fixed,{kind:"start",bestOf:5});
  assert.deepEqual(standings(playing,1).map(r=>r.player.id),["3","1","2"]);
  assert.throws(()=>transition(playing,{kind:"start",bestOf:3}));
  const moved=arrangePlayers(e.participants,"3",{group:2});
  assert.equal(moved.filter(p=>p.group===2).length,4);
  const invalid=arrangePlayers(moved,"1",{group:2});
  assert.throws(()=>transition(null,{kind:"confirm",event:{...e,participants:invalid}}));
});
test("Solo una falta confirmada reduce el honorario y el prorrateo conserva los céntimos",async()=>{
  const {courseLessons,teacherPay,uniqueIncome}=await import("../lib/teaching-ledger.ts");
  const c={id:"c",name:"Saque",starts:"2026-11-01",ends:"2026-11-16",slots:["Lun · 8:00 AM"],teachers:["A","B"]};
  const lessons=courseLessons(c,[],[]);
  assert.equal(lessons.length,3);
  const plan={teacher:"A",courseId:"c",role:"Principal",cents:10000};
  const now=Date.parse("2026-11-10T10:00:00-05:00");
  const mark={courseId:"c",teacher:"A",lessonId:lessons[0].id,state:"missed",startsAt:lessons[0].startsAt};
  let detail=teacherPay(c,"A",plan,lessons,[mark],now);
  assert.deepEqual(detail.entries.map(s=>s.state),["missed","pending","future"]);
  assert.deepEqual(detail.entries.map(s=>s.share),[3334,3333,3333]);
  assert.equal(detail.net,6666);
  assert.equal(teacherPay(c,"B",{...plan,teacher:"B",role:"De apoyo"},lessons,[mark],now).discount,0);
  assert.equal(teacherPay(c,"A",plan,lessons,[{...mark,state:"taught"}],now).net,10000);
  const official=[{...lessons[0],status:"cancelled",teacher:"A"},{...lessons[1],status:"completed",teacher:"A"}];
  assert.equal(courseLessons(c,official,[]).length,1);
  assert.equal(teacherPay(c,"A",plan,courseLessons(c,official,[]),[],now).entries[0].state,"taught");
  const receipts=[{id:"1",source:"Izipay",reference:"OP9"},{id:"2",source:"Izipay",reference:"OP9"},{id:"3",source:"Manual"}];
  assert.equal(uniqueIncome(receipts).length,2);
});
