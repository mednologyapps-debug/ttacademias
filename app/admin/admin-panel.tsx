"use client";

import {StandingsTable} from "@/components/academy-standings";
import {academyTable,groupLabel} from "@/lib/tournament";
import GroupBoard from "./group-board";
import TournamentPanel from "./tournament-panel";
import CourseLedger, { AssignmentFields, type DraftFee } from "./course-ledger";
import {slotTime} from "@/lib/teaching-ledger";
import type { Finance } from "@/lib/course-finance";
import type { Tournament, Move } from "@/lib/tournament";
import EnrollmentPanel from "./enrollment-panel";
import Modal from "@/components/modal";

import "./workspace.css";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, CalendarDays, ChevronDown, ChevronRight, CircleDollarSign,
  ClipboardList, Clock3, CreditCard, GraduationCap, LayoutDashboard, Menu,
  MessageSquareText, Plus, Search, Settings, ShieldCheck, Trophy, UserRound,
  Users, X, CheckCircle2, ArrowUpRight, SlidersHorizontal, MapPin, MoreHorizontal,
  Pencil, Trash2, CalendarClock, Copy, ExternalLink, Link2, Check, CirclePlus, LogOut,
} from "lucide-react";

type Section = "Resumen" | "Alumnos" | "Profesores" | "Cursos" | "Clases" | "Rankings" | "Pagos" | "Avisos" | "Mi academia";
type Course = { id: string; name: string; level: string; teachers: string[]; students: string[]; price: string; starts: string; ends: string; slots: string[] };
type AcademyStudent = { dni: string; name: string };
type RankingParticipant = { id: string; name: string; kind: "Alumno" | "Externo"; dni?: string; paid: boolean; weight: number; group?: number };
type Ranking = { id: string; title: string; date: string; time: string; venue: string; studentPrice: number; publicPrice: number; capacity: number; participants: RankingParticipant[] };
const nav: { label: Section; icon: typeof LayoutDashboard; group: string }[] = [
  { label: "Resumen", icon: LayoutDashboard, group: "GESTIÓN" },
  { label: "Alumnos", icon: Users, group: "GESTIÓN" },
  { label: "Profesores", icon: GraduationCap, group: "GESTIÓN" },
  { label: "Cursos", icon: CalendarDays, group: "ACADEMIA" },
  { label: "Clases", icon: ClipboardList, group: "ACADEMIA" },
  { label: "Rankings", icon: Trophy, group: "ACADEMIA" },
  { label: "Pagos", icon: CreditCard, group: "ADMINISTRACIÓN" },
  { label: "Avisos", icon: MessageSquareText, group: "ADMINISTRACIÓN" },
  { label: "Mi academia", icon: Settings, group: "ADMINISTRACIÓN" },
];
const initialRows: Record<Exclude<Section, "Resumen" | "Mi academia">, string[][]> = {
  Alumnos: [], Profesores: [], Cursos: [], Clases: [], Rankings: [], Pagos: [], Avisos: [],
};
const actionLabel: Partial<Record<Section, string>> = { Alumnos: "Agregar alumno", Profesores: "Agregar profesor", Cursos: "Crear curso", Clases: "Programar clase", Rankings: "Crear ranking", Avisos: "Publicar aviso" };
const teacherCalendarDays = [{ day: "Lun", date: "17" }, { day: "Mar", date: "18" }, { day: "Mié", date: "19" }, { day: "Jue", date: "20" }, { day: "Vie", date: "21" }, { day: "Sáb", date: "22" }, { day: "Dom", date: "23" }];
const weekdayCodes = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const twoHourBlocks = ["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];
export default function AdminPanel({adminName="Administrador"}:{adminName?:string}) {
  const [section, setSection] = useState<Section>("Resumen");
  const [rows, setRows] = useState(initialRows);
  const [courses, setCourses] = useState<Course[]>([]);
  const [ops,setOps] = useState<Record<string,{revision:number;value:unknown}>>({});
  const [opsReady,setOpsReady] = useState(false);
  const [opsError,setOpsError] = useState("");
  const [saving,setSaving] = useState(false);
  const [editingTeacher,setEditingTeacher] = useState<string|null>(null);
  const [fees,setFees] = useState<DraftFee[]>([]);
  const terms=ops.finance?.value as Finance|undefined;
  const finance:Finance={...terms,courses,teachers:rows.Profesores,contracts:terms?.contracts||[],receipts:terms?.receipts||[]};
  const savedLessons=(finance.lessons||[]).filter(s=>s.status!=="cancelled");
  const classRows=[...savedLessons.map(s=>{
    const course=courses.find(c=>c.id===s.courseId);
    return [s.title,course?.name||"",new Date(s.startsAt).toLocaleString("es-PE",{timeZone:"America/Lima",dateStyle:"medium",timeStyle:"short"}),s.teacher||"",String(course?.students.length||0)+" alumnos"];
  }),...rows.Clases];
  function applyFinance(data:Finance) {
    setCourses(data.courses);
    setRows(old=>({...old,Profesores:data.teachers,Cursos:data.courses.map(courseToRow)}));
  }
  async function refreshOps() {
    try {
      const res=await fetch("/api/academy/operations",{cache:"no-store"});
      const data=await res.json(); if(!res.ok)throw Error(data.error);
      setOps(data);setRows(old=>({...old,Alumnos:data.roster?.value||[],Avisos:data.announcements?.value||[]}));if(data.finance)applyFinance(data.finance.value);setOpsReady(true);setOpsError("");
    }catch {setOpsReady(false);setOpsError("No se pudieron cargar los honorarios y resultados guardados.");}
  }
  useEffect(()=>{void refreshOps();window.addEventListener("focus",refreshOps);return ()=>window.removeEventListener("focus",refreshOps);},[]);
  async function persist(key:string,body:{value?:Finance|string[][];action?:Move;password?:string}) {
    if(!opsReady || saving) return false;
    setSaving(true);
    try {
      const res=await fetch("/api/academy/operations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key,revision:ops[key]?.revision||0,...body})});
      const data=await res.json();
      if(!res.ok){if(res.status===409)await refreshOps();throw Error(data.error);}
      setOps(old=>({...old,[key]:data}));
      if(key==="finance")applyFinance(data.value);
      if(key==="announcements")setRows(old=>({...old,Avisos:data.value}));
      return true;
    }catch(e){notify(e instanceof Error?e.message:"No se pudieron guardar los cambios.");return false;}
    finally {setSaving(false);}
  }
  const persistedEvents=Object.entries(ops).filter(([k])=>k.startsWith("event:")).map(([,r])=>r.value as Tournament);
  const rankings=persistedEvents.filter(t=>t.phase==="open").map(t=>t.event);
  const rankingList=persistedEvents.filter(t=>t.phase!=="withdrawn").map(t=>t.event).sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
  const rankingRows=rankingList.map(r=>{
    const t=ops["event:"+r.id]?.value as Tournament|undefined;
    const row=rankingToRow(t?.event||r);
    if(t && t.phase!=="open")row[3]=t.phase==="closed"?"Cerrado":t.phase==="confirmed"?"Grupos confirmados":"En juego";
    return row;
  });
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editRecord, setEditRecord] = useState<{ section: Section; index: number; values: string[] } | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<{ section: Section; index: number; name: string } | null>(null);
  const [studentDetails, setStudentDetails] = useState<string[] | null>(null);
  const [courseStudentsView, setCourseStudentsView] = useState<Course | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingRankingId, setEditingRankingId] = useState<string | null>(null);
  const [activeRankingId, setActiveRankingId] = useState<string | null>(null);
  useEffect(()=>{
    if(section!=="Rankings" || !activeRankingId)return;
    const ctrl=new AbortController(),key="event:"+activeRankingId;
    async function refreshEvent(){
      if(document.hidden)return;
      try{
        const res=await fetch("/api/academy/operations?event="+encodeURIComponent(activeRankingId!),{signal:ctrl.signal,cache:"no-store"});
        if(!res.ok)return;
        const data=await res.json();
        if(data)setOps(old=>data.revision>(old[key]?.revision||0)?{...old,[key]:data}:old);
      }catch{/* Focus and the next poll retry a transient connection. */}
    }
    const timer=window.setInterval(refreshEvent,6000);
    return()=>{ctrl.abort();window.clearInterval(timer);};
  },[section,activeRankingId]);
  const [scheduleEditor, setScheduleEditor] = useState<{ courseId: string | null; draft: string[]; step: "edit" | "confirm" } | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [academyName, setAcademyName] = useState("TT Academias");
  const [brandColor, setBrandColor] = useState("#0b50c8");
  const [logoUrl, setLogoUrl] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDetail, setFormDetail] = useState("");
  const [memberBirth, setMemberBirth] = useState("");
  const [memberDni, setMemberDni] = useState("");
  const [memberPassword,setMemberPassword]=useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberLevel, setMemberLevel] = useState("Intermedio");
  const [teacherLevels, setTeacherLevels] = useState<string[]>([]);
  const [teacherSlots, setTeacherSlots] = useState<string[]>([]);
  const [courseLevel, setCourseLevel] = useState("Intermedio");
  const [courseTeachers, setCourseTeachers] = useState<string[]>([]);
  const [courseStudents, setCourseStudents] = useState<string[]>([]);
  const [coursePrice, setCoursePrice] = useState("");
  const [courseStarts, setCourseStarts] = useState("");
  const [courseEnds, setCourseEnds] = useState("");
  const [courseSlots, setCourseSlots] = useState<string[]>([]);
  const [classCourseId, setClassCourseId] = useState("");
  const [classTeacher, setClassTeacher] = useState("");
  const [classDate, setClassDate] = useState("");
  const [classTime, setClassTime] = useState("");
  const [rankingDate, setRankingDate] = useState("");
  const [rankingTime, setRankingTime] = useState("4:00 PM");
  const [rankingVenue, setRankingVenue] = useState("");
  const [rankingStudentPrice, setRankingStudentPrice] = useState("");
  const [rankingPublicPrice, setRankingPublicPrice] = useState("");
  const [rankingCapacity, setRankingCapacity] = useState("20");

  useEffect(() => {
    fetch("/api/academy/settings").then(async (response) => { if (!response.ok) return; const data = await response.json(); const academy = data.academy; if (!academy) return; setAcademyName(academy.name); setBrandColor(academy.primaryColor); setLogoUrl(academy.logoUrl || ""); }).catch(() => undefined);
  }, []);
  const filteredRows = (() => {
    if (!(section in rows)) return [];
    const table = section==="Rankings"?rankingRows:section==="Clases"?classRows:rows[section as keyof typeof rows];
    return table.filter((row) => row.join(" ").toLowerCase().includes(search.toLowerCase()));
  })();
  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  async function saveAcademySettings() {
    const response = await fetch("/api/academy/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: academyName, primaryColor: brandColor, logoUrl }) });
    const result = await response.json();
    if (!response.ok) { notify(result.error || "No se pudo guardar la identidad de academia"); return; }
    document.body.style.setProperty("--brand", brandColor);
    document.body.style.setProperty("--brand-bright", brandColor);
    document.body.style.setProperty("--brand-hover", `color-mix(in srgb, ${brandColor} 82%, #000)`);
    document.body.style.setProperty("--brand-soft", `color-mix(in srgb, ${brandColor} 8%, #fff)`);
    document.body.style.setProperty("--brand-border", `color-mix(in srgb, ${brandColor} 18%, #fff)`);
    notify("Identidad guardada para el portal de la academia");
  }
  async function saveStudent(row:string[],original?:string,remove=false){
    try {
      const res=await fetch("/api/academy/students",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({row,original,remove,password:memberPassword})});
      if(!res.ok)throw Error((await res.json()).error);
      await refreshOps();return true;
    }catch(e){notify(e instanceof Error?e.message:"No se pudo guardar el alumno.");return false;}
  }
  async function saveRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!(section in rows)) return;
    if (section === "Alumnos") {
      if (!/^\d{8}$/.test(memberDni)) { notify("Ingresa un DNI válido de 8 dígitos"); return; }
      if (rows.Alumnos.some((student) => student[1] === memberDni)) { notify("Ya existe un alumno con ese DNI"); return; }
      const row = [formTitle, memberDni, memberBirth, memberLevel, memberEmail, memberPhone, "Activo"];
      if(!await saveStudent(row))return;
    } else if (section === "Profesores") {
      if (!teacherLevels.length || !teacherSlots.length) { notify("Selecciona los niveles que enseña y al menos un bloque disponible"); return; }
      const row = [formTitle, memberBirth, teacherLevels.join(" · "), memberEmail, memberPhone, teacherSlots.join(" | ")];
      const name=formTitle.trim();row[0]=name;
      if(!name || rows.Profesores.some(t=>t[0]!==editingTeacher && t[0].toLowerCase()===name.toLowerCase())) {notify("Revisa el nombre del profesor. Debe ser único.");return;}
      if(!fees.length || fees.some(f=>!f.amount.trim() || !Number.isFinite(Number(f.amount)) || Number(f.amount)<0)){notify("Asigna al menos un curso con su función e importe.");return;}
      const nextTeachers=editingTeacher?finance.teachers.map(t=>t[0]===editingTeacher?row:t):[row,...finance.teachers];
      const nextCourses=courses.map(c=>{
        const names=c.teachers.filter(n=>n!==editingTeacher && n!==name);
        return {...c,teachers:fees.some(f=>f.courseId===c.id)?[...names,name]:names};
      });
      const contracts=[...finance.contracts.filter(c=>c.teacher!==editingTeacher),...fees.map(f=>({courseId:f.courseId,teacher:name,role:f.role,cents:Math.round(Number(f.amount)*100)}))];
      const attendance=(finance.attendance||[]).map(m=>m.teacher===editingTeacher?{...m,teacher:name}:m);
      if(attendance.some(m=>m.teacher===name && !fees.some(f=>f.courseId===m.courseId))){notify("Este curso tiene asistencia docente registrada. Conserva su asignación.");return;}
      const lessons=(finance.lessons||[]).map(s=>s.teacher===editingTeacher?{...s,teacher:name}:s);
      if(!await persist("finance",{password:memberPassword,value:{...finance,teachers:nextTeachers,courses:nextCourses,contracts,attendance,lessons}}))return;

    } else if (section === "Cursos") {
      if (!courseSlots.length || !coursePrice || !courseStarts || !courseEnds) { notify("Completa precio, fechas y al menos un horario"); return; }
      if (courseEnds < courseStarts) { notify("La fecha de fin debe ser posterior a la fecha de inicio"); return; }
      const currentCourse = courses.find((course) => course.id === editingCourseId);
      const course: Course = { id: currentCourse?.id || `course-${Date.now()}`, name: formTitle, level: courseLevel, teachers: courseTeachers, students: courseStudents, price: coursePrice, starts: courseStarts, ends: courseEnds, slots: courseSlots };
      const nextCourses=currentCourse?courses.map(c=>c.id===course.id?course:c):[...courses,course];
      if(finance.contracts.some(f=>f.courseId===course.id && !course.teachers.includes(f.teacher))){notify("Modifica la asignación desde Profesores para actualizar los honorarios.");return;}
      if(!await persist("finance",{value:{...finance,courses:nextCourses}}))return;
    } else if (section === "Clases") {
      const course = courses.find((item) => item.id === classCourseId);
      if (!course || !course.teachers.includes(classTeacher)) { notify("Selecciona un profesor asociado al curso"); return; }
      if (!classDate || !classTime) { notify("Selecciona una fecha y un horario disponibles del curso"); return; }
      const dateOptions = getCourseAvailableDates(course);
      if (!dateOptions.includes(classDate)) { notify("Elige una de las fechas programadas dentro de la vigencia del curso"); return; }
      const weekday = weekdayCodes[new Date(`${classDate}T12:00:00`).getDay()];
      if (!(classTime.startsWith(`${weekday} ·`) || classTime.startsWith(`${weekday} `))) { notify("El horario no corresponde a la fecha elegida"); return; }
      const time=slotTime(classTime);
      if(!time){notify("Elige un horario válido.");return;}
      const local=classDate+"T"+time;
      const other=(finance.lessons||[]).find(s=>s.courseId===course.id && Date.parse(s.startsAt)===Date.parse(local+":00-05:00"));
      if(other && other.status!=="cancelled"){notify("Ya hay una clase registrada en ese horario.");return;}
      const lesson={id:other?.id||crypto.randomUUID(),courseId:course.id,title:formTitle,startsAt:local+":00-05:00",teacher:classTeacher};
      if(!await persist("finance",{value:{...finance,lessons:[...(finance.lessons||[]).filter(s=>s!==other),lesson]}}))return;
    } else if (section === "Rankings") {
      if (!rankingDate || !rankingVenue || !rankingStudentPrice || !rankingPublicPrice || !rankingCapacity) { notify("Completa fecha, sede, precios y aforo"); return; }
      const editedRanking = rankings.find((item) => item.id === editingRankingId);
      const ranking: Ranking = { id: editedRanking?.id || crypto.randomUUID(), title: formTitle, date: rankingDate, time: rankingTime, venue: rankingVenue, studentPrice: Number(rankingStudentPrice), publicPrice: Number(rankingPublicPrice), capacity: Number(rankingCapacity), participants: editedRanking?.participants || [] };
      if (ranking.capacity < ranking.participants.length) { notify("El aforo no puede ser menor a los inscritos actuales"); return; }
      if(!await persist("event:"+ranking.id,{action:{kind:"save",event:ranking}}))return;
    } else {
      const row = [formTitle, formDetail, "Toda la academia", "Publicado"];
      if(section==="Avisos" && !await persist("announcements",{value:[row,...rows.Avisos]}))return;

    }
    setFormTitle(""); setFormDetail(""); setMemberBirth(""); setMemberDni(""); setMemberEmail(""); setMemberPhone(""); setTeacherSlots([]); setTeacherLevels([]); setCourseLevel("Intermedio"); setCourseTeachers([]); setCourseStudents([]); setCourseSlots([]); setCoursePrice(""); setCourseStarts(""); setCourseEnds(""); setClassDate(""); setRankingDate(""); setRankingVenue(""); setEditingCourseId(null); setEditingRankingId(null); setDialog(false);
    notify(section === "Cursos" ? editingCourseId ? "Curso actualizado" : "Curso creado" : section === "Clases" ? "Clase añadida al curso" : section === "Rankings" ? editingRankingId ? "Ranking actualizado" : "Ranking creado · ya puedes compartir su enlace" : section==="Profesores" ? "Profesor y honorarios guardados" : "Registro guardado");
  }
  function openCourseSchedule(course: Course | null) {
    setScheduleEditor({ courseId: course?.id || null, draft: [...(course?.slots || courseSlots)], step: "edit" });
  }
  async function confirmCourseSchedule() {
    if (!scheduleEditor) return;
    if (!scheduleEditor.draft.length) { notify("Selecciona al menos un bloque semanal"); return; }
    if (scheduleEditor.step === "edit") { setScheduleEditor({ ...scheduleEditor, step: "confirm" }); return; }
    if (scheduleEditor.courseId) {
      const course = courses.find((item) => item.id === scheduleEditor.courseId);
      if (course) {
        const updated = { ...course, slots: scheduleEditor.draft };
        if(!await persist("finance",{value:{...finance,courses:courses.map(c=>c.id===course.id?updated:c)}}))return;
      }
    } else setCourseSlots(scheduleEditor.draft);
    setScheduleEditor(null);
    notify("Horario confirmado y actualizado");
  }
  function openEditRecord(target: Section, row: string[]) {
    const index = (target==="Clases"?classRows:rows[target as keyof typeof rows] as string[][]).indexOf(row);
    if (target === "Cursos") {
      const course = courses[index];
      if (!course) return;
      setEditingCourseId(course.id); setFormTitle(course.name); setCourseLevel(course.level); setCourseTeachers([...course.teachers]); setCourseStudents([...course.students]); setCoursePrice(course.price); setCourseStarts(course.starts); setCourseEnds(course.ends); setCourseSlots([...course.slots]); setSection("Cursos"); setDialog(true);
    } else if(target==="Profesores"){
      setMemberPassword("");setEditingTeacher(row[0]);setFormTitle(row[0]);setMemberBirth(row[1]);setTeacherLevels(row[2].split(" · ").filter(Boolean));setMemberEmail(row[3]);setMemberPhone(row[4]);
      setTeacherSlots(row[5].includes(" | ")?row[5].split(" | "):row[5].split(/ · (?=(?:Lun|Mar|Mié|Jue|Vie|Sáb|Dom) )/).filter(Boolean));
      setFees(courses.filter(c=>c.teachers.includes(row[0])).map(c=>{
        const f=finance.contracts.find(f=>f.courseId===c.id&&f.teacher===row[0]);
        return {courseId:c.id,role:f?.role||"Principal",amount:f?String(f.cents/100):""};
      }));setDialog(true);
    } else if (target === "Rankings") {
      const ranking = rankingList[rankingRows.indexOf(row)];
      if (!ranking) return;
      setEditingRankingId(ranking.id); setFormTitle(ranking.title); setRankingDate(ranking.date); setRankingTime(ranking.time); setRankingVenue(ranking.venue); setRankingStudentPrice(String(ranking.studentPrice)); setRankingPublicPrice(String(ranking.publicPrice)); setRankingCapacity(String(ranking.capacity)); setSection("Rankings"); setDialog(true);
    } else setEditRecord({ section: target, index, values: [...row] });
  }
  async function confirmDeleteRecord() {
    if (!deleteRecord) return;
    const { section: target } = deleteRecord;
    let index=deleteRecord.index;
    if(target==="Clases"){
      const lesson=savedLessons[index];
      if(lesson){
        if(finance.attendance?.some(m=>m.courseId===lesson.courseId && m.lessonId===lesson.id)){notify("La clase tiene asistencia docente registrada.");return;}
        if(await persist("finance",{value:{...finance,lessons:finance.lessons?.map(s=>s===lesson?{...s,status:"cancelled"}:s)}}))setDeleteRecord(null);
        return;
      }
      index-=savedLessons.length;
    }
    if(target==="Alumnos" || target==="Avisos"){
      const ok=target==="Alumnos"?await saveStudent(rows.Alumnos[index],rows.Alumnos[index][4],true):await persist("announcements",{value:rows.Avisos.filter((_,i)=>i!==index)});
      if(ok)setDeleteRecord(null);return;
    }
    if(target==="Cursos" || target==="Profesores") {
      const id=courses[index]?.id, teacher=rows.Profesores[index]?.[0];
      if(target==="Cursos" && (finance.receipts.some(r=>r.courseId===id)||finance.contracts.some(f=>f.courseId===id)||finance.lessons?.some(l=>l.courseId===id)||finance.attendance?.some(m=>m.courseId===id)) || target==="Profesores" && (finance.contracts.some(f=>f.teacher===teacher)||finance.lessons?.some(l=>l.teacher===teacher)||finance.attendance?.some(m=>m.teacher===teacher))){
        notify("El registro tiene clases, cobros u honorarios asociados.");return;
      }
      const next=target==="Cursos"?{...finance,courses:courses.filter(c=>c.id!==id)}:{...finance,teachers:rows.Profesores.filter(t=>t[0]!==teacher),courses:courses.map(c=>({...c,teachers:c.teachers.filter(n=>n!==teacher)}))};
      if(await persist("finance",{value:next}))setDeleteRecord(null);return;
    }
    if(target==="Rankings"){
      const event=rankingList[index];
      if(event && await persist("event:"+event.id,{action:{kind:"withdraw"}}))setDeleteRecord(null);
      return;
    }
    setDeleteRecord(null); notify("Registro eliminado");
  }
  async function saveGenericEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editRecord) return;
    const { section: target, values } = editRecord;
    let index=editRecord.index;
    if(target==="Clases"){
      const lesson=savedLessons[index];
      if(lesson){
        if(!values[0].trim()){notify("Ingresa el nombre de la clase.");return;}
        if(await persist("finance",{value:{...finance,lessons:finance.lessons?.map(s=>s===lesson?{...s,title:values[0].trim()}:s)}}))setEditRecord(null);
        return;
      }
      index-=savedLessons.length;
    }
    if(target==="Alumnos" && !await saveStudent(values,rows.Alumnos[index][4]))return;
    if(target==="Avisos" && !await persist("announcements",{value:rows.Avisos.map((r,i)=>i===index?values:r)}))return;
    setEditRecord(null); notify("Cambios guardados");
  }
  function changeSection(target: Section) { setSection(target); setSearch(""); setMobileMenu(false); }
  async function logout() { try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.assign("/login"); } }
  function openCreate(target: Section) {
    setMemberPassword("");setEditingTeacher(null);setFees([]);
    setSection(target); setSearch(""); setActiveRankingId(null); setFormTitle(""); setFormDetail(""); setMemberBirth(""); setMemberDni(""); setMemberEmail(""); setMemberPhone(""); setTeacherSlots([]); setTeacherLevels([]); setCourseLevel("Intermedio"); setCourseTeachers([]); setCourseStudents([]); setCourseSlots([]); setCoursePrice(""); setCourseStarts(""); setCourseEnds(""); setClassDate(""); setRankingDate(""); setRankingVenue(""); setEditingCourseId(null); setEditingRankingId(null); if (target === "Clases") { const course = courses[0]; setClassCourseId(course?.id || ""); setClassTeacher(course?.teachers[0] || ""); setClassTime(course?.slots[0] || ""); } setDialog(true);
  }

  return <main className="admin-app" style={{ ["--admin-brand" as string]: brandColor } as React.CSSProperties}>
    {opsError && <button className="ops-retry" onClick={refreshOps}>{opsError} Reintentar</button>}
    <aside className={`admin-sidebar ${mobileMenu ? "open" : ""}`}>
      <a href="/" className="rail-brand" aria-label={`Ir a la landing de ${academyName}`}>
        <span className="admin-brand-mark">{logoUrl ? <img src={logoUrl} alt="" /> : <Activity size={20} />}</span>
        <span className="rail-caption">{academyName}</span>
      </a>
      <nav className="rail-list" aria-label="Administración">
        {["GESTIÓN", "ACADEMIA", "ADMINISTRACIÓN"].map((group) => (
          <div className="rail-group" key={group} role="group" aria-label={group}>
            {nav.filter((item) => item.group === group).map(({ label, icon: Icon }) => (
              <button key={label} aria-label={label} aria-current={section === label ? "page" : undefined}
                onClick={() => changeSection(label)}>
                <Icon size={20} /><span className="rail-caption">{label}</span>
                
              </button>
            ))}
          </div>
        ))}
      </nav>
      <button className="rail-exit" aria-label="Cerrar sesión" onClick={() => void logout()}>
        <LogOut size={20}/><span className="rail-caption">Cerrar sesión</span>
      </button>
    </aside>
    {mobileMenu && <button className="admin-mobile-scrim" aria-label="Cerrar menú" onClick={() => setMobileMenu(false)} />}
    <section className="admin-main">
      <header className="admin-topbar"><button className="admin-menu-toggle" aria-label="Abrir menú" onClick={() => setMobileMenu((v) => !v)}><Menu size={20} /></button><div className="admin-breadcrumb"><span>Academia</span><ChevronRight size={14} /><strong>{section}</strong></div><div className="admin-top-actions"><div className="admin-profile"><span>{adminName.slice(0,1)}</span><strong>{adminName}</strong></div><button className="admin-logout-top" onClick={() => void logout()} title="Cerrar sesión"><LogOut size={16}/><span>Cerrar sesión</span></button></div></header>
      <div className="admin-workspace">
        {section === "Resumen" ? <>
          <div className="admin-page-heading"><div><h1>Centro de gestión</h1><p>{academyName}</p></div><button className="admin-primary-button" disabled={!opsReady} onClick={()=>openCreate("Rankings")}><Plus size={17}/> Crear ranking</button></div>
          <div className="admin-stats-grid">{([
            ["Alumnos",rows.Alumnos.length,Users],["Cursos",courses.length,GraduationCap],["Clases",savedLessons.length,CalendarDays],["Rankings",rankingList.length,Trophy]
          ] as const).map(([label,count,Icon])=><button className="admin-stat-card" key={label} onClick={()=>changeSection(label)}><Icon size={23}/><strong className="stat-value">{opsReady?count:"…"}</strong><span>{label}</span></button>)}</div>
          <section className="admin-panel-card"><div className="admin-card-heading"><h2>Competencias de la academia</h2><button className="admin-plain-link" onClick={()=>changeSection("Rankings")}>Ver rankings</button></div>
          {rankingList.slice(0,4).map((r,i)=><button key={r.id} className="ops-match" onClick={()=>{changeSection("Rankings");setActiveRankingId(r.id);}}><strong>{r.title}</strong><span>{rankingRows[i][3]}</span></button>)}
          {opsReady&&!rankingList.length&&<p>Publica el primer ranking para abrir las inscripciones.</p>}</section>
        </> : section === "Rankings" && activeRankingId ? (() => {
          const ranking = rankingList.find((item) => item.id === activeRankingId);
          if (!ranking) return <div className="admin-empty-state"><button className="admin-plain-link" onClick={() => setActiveRankingId(null)}>Volver a rankings</button></div>;
          const key="event:"+ranking.id;
          const stored=ops[key]?.value as Tournament|undefined;
          const competition=stored?.phase==="open"?undefined:stored;
          return <>{competition?<><button className="back-link" onClick={()=>setActiveRankingId(null)}>Volver a rankings</button><h1>{competition.event.title}</h1></>:<RankingManager ranking={ranking} academyStudents={rows.Alumnos.map((row) => ({ name: row[0], dni: row[1] }))} onBack={() => setActiveRankingId(null)} onToast={notify} onChange={updated=>persist(key,{action:{kind:"save",event:updated}})} />}
          <TournamentPanel key={key} event={{...ranking, participants:ranking.participants.map(p=>{
            if(p.dni || p.kind!=="Alumno")return p;
            const matches=rows.Alumnos.filter(row=>row[0]===p.name);
            return matches.length===1?{...p,dni:matches[0][1]}:p;
          })}} t={competition} busy={!opsReady||saving} onMove={action=>persist(key,{action})}/></>;
        })() : section==="Pagos"?<>
          <div className="admin-page-heading"><h1>Pagos</h1></div>
          <CourseLedger data={finance} busy={!opsReady||saving}
            mark={(mark,state)=>persist("finance",{value:{...finance,attendance:[...(finance.attendance||[]).filter(m=>m.teacher!==mark.teacher || m.courseId!==mark.courseId || m.lessonId!==mark.lessonId),{...mark,state}]}})}
            save={receipt=>persist("finance",{value:{...finance,receipts:[...finance.receipts,receipt]}})}/>
        </> : section === "Mi academia" ? <>
          <div className="admin-page-heading"><div><span className="admin-eyebrow">PERSONALIZACIÓN</span><h1>Mi academia</h1><p>Configura la identidad que verán tus alumnos en el subdominio.</p></div><div className="tenant-domain"><ShieldCheck size={16} /> {typeof window==="undefined"?"":window.location.hostname}</div></div><div className="settings-layout"><section className="admin-panel-card academy-settings-card"><div className="admin-card-heading"><div><h2>Marca y portal</h2><p>Estos datos personalizan el portal de estudiantes.</p></div></div><label className="admin-form-label">Nombre de la academia<input value={academyName} onChange={(e) => setAcademyName(e.target.value)} /></label><label className="admin-form-label">URL del logo<input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://.../logo.png" /></label><label className="admin-form-label">Color principal<div className="color-picker-row"><input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} /><input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} /></div></label><button className="admin-primary-button" onClick={() => void saveAcademySettings()}><CheckCircle2 size={16} /> Guardar cambios</button><p className="admin-form-hint">El logo y el color se guardan y se aplican al subdominio de esta academia.</p></section><section className="admin-panel-card portal-preview-card"><div className="admin-card-heading"><div><h2>Vista previa del estudiante</h2><p>Ejemplo del encabezado de tu portal</p></div></div><div className="portal-preview" style={{ ["--preview-brand" as string]: brandColor } as React.CSSProperties}><div className="preview-header"><span>{logoUrl ? <img src={logoUrl} alt="" /> : <Activity size={18} />}</span><strong>{academyName}</strong></div><div className="preview-welcome"><small>MIÉRCOLES, 18 NOV</small><h3>Hola, Mateo</h3><p>Sede Miraflores</p></div><div className="preview-class"><span>CLASE DE HOY</span><strong>Control de Saques &amp; Topspin</strong><button>Confirmar asistencia</button></div></div></section></div>
        </> : <>
          <div className="admin-page-heading"><div><h1>{section}</h1><p>{sectionDescription(section)}</p></div>{actionLabel[section] && <button className="admin-primary-button" onClick={() => openCreate(section)}><Plus size={17} />{actionLabel[section]}</button>}</div>
          {section === "Rankings" && <StandingsTable rows={opsReady?academyTable(persistedEvents):undefined} error={!!opsError}/>}

          {section === "Alumnos" && <EnrollmentPanel key="requests" onRegister={r=>{
            const existing=rows.Alumnos.find(row=>row[1]===r.dni || row[4].toLowerCase()===r.email.toLowerCase());
            if(existing){setStudentDetails(existing);return;}
            openCreate("Alumnos");setFormTitle(r.firstName+" "+r.lastName);setMemberBirth(r.birthDate);setMemberDni(r.dni);setMemberEmail(r.email);setMemberPhone(r.phone);setMemberLevel(r.level);
          }}/>}
          {section === "Cursos" && <EnrollmentPanel key="offers" courses={courses}/>}
          <div className="admin-panel-card admin-table-card"><div className="admin-list-toolbar"><label className="admin-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Buscar en ${section.toLowerCase()}...`} /></label><span>{filteredRows.length} registros</span></div>
          <div className="admin-table-wrap"><table><thead><tr>{(section === "Alumnos" ? ["ALUMNO", "EDAD", "NIVEL", "CORREO", "CELULAR", "MATRÍCULA"] : section === "Profesores" ? ["PROFESOR", "FECHA NACIMIENTO", "NIVELES QUE ENSEÑA", "CORREO", "CELULAR", "BLOQUES DISPONIBLES"] : section === "Cursos" ? ["CURSO", "NIVEL · HORARIO", "ALUMNOS MATRICULADOS", "PROFESORES", "VIGENCIA", "COSTO TOTAL"] : section === "Clases" ? ["CLASE / SESIÓN", "CURSO", "FECHA Y HORA", "PROFESOR", "ALUMNOS"] : section === "Rankings" ? ["RANKING", "FECHA", "CUPOS", "ESTADO"] : ["AVISO", "MENSAJE", "DESTINATARIOS", "ESTADO"]).map((head) => <th scope="col" key={head}>{head.charAt(0) + head.slice(1).toLocaleLowerCase("es-PE")}</th>)}<th /></tr></thead><tbody>{filteredRows.map((row, index) => {
            const sourceIndex = (section==="Rankings"?rankingRows:section==="Clases"?classRows:rows[section as keyof typeof rows] as string[][]).indexOf(row);
            const cells = section === "Alumnos" ? [row[0], String(calculateAge(row[2])), row[3], row[4], row[5], row[6]] : section === "Cursos" ? [row[0], `${row[1]} · ${row[6]}`, row[2], row[3], row[4], row[5]] : row;
            return <tr key={`${row[0]}-${index}`} className={section === "Cursos" ? "course-list-row" : ""}>{cells.map((cell, cellIndex) => <td key={cellIndex}>{cellIndex === 0 && section === "Cursos" ? <button className="course-title-link" onClick={() => setCourseStudentsView(courses[sourceIndex] || null)}>{cell}<ChevronRight size={14}/></button> : cellIndex===0 && section==="Rankings"?<button className="course-title-link" onClick={()=>setActiveRankingId(rankingList[sourceIndex].id)}>{cell}</button>:cellIndex === 0 ? <strong>{cell}</strong> : section === "Alumnos" && cellIndex === 5 ? <button className="enrollment-view-button" onClick={() => setStudentDetails(row)}>Ver matrícula <ChevronRight size={13}/></button> : section === "Cursos" && cellIndex === 2 ? <button className="course-participants-button" onClick={() => setCourseStudentsView(courses[sourceIndex] || null)}>{cell} <ChevronRight size={13}/></button> : section === "Alumnos" && cellIndex === 1 ? <span className="age-value">{cell} años</span> : cellIndex === row.length - 1 && !["Alumnos", "Profesores", "Cursos", "Clases"].includes(section) ? <span className={`table-status ${cell.toLowerCase().includes("pendiente") || cell.toLowerCase().includes("renovar") ? "warning" : ""}`}><i />{cell}</span> : cell}</td>)}<td><div className="admin-row-actions">{section === "Cursos" && <button className="row-action" title="Ver o editar horario" aria-label={`Horario de ${row[0]}`} onClick={() => openCourseSchedule(courses[sourceIndex] || null)}><CalendarClock size={15} /></button>}{section === "Rankings" && <button className="row-action manage" title="Gestionar ranking" aria-label={`Gestionar ${row[0]}`} onClick={() => setActiveRankingId(rankingList[sourceIndex]?.id || null)}><Users size={15} /></button>}<button disabled={section==="Rankings" && (ops["event:"+rankingList[sourceIndex]?.id]?.value as Tournament)?.phase!=="open"} className="row-action" title="Editar" aria-label={`Editar ${row[0]}`} onClick={() => openEditRecord(section, row)}><Pencil size={14} /></button><button disabled={section==="Rankings" && (ops["event:"+rankingList[sourceIndex]?.id]?.value as Tournament)?.phase!=="open"} className="row-action delete" title="Eliminar" aria-label={`Eliminar ${row[0]}`} onClick={() => setDeleteRecord({ section, index: sourceIndex, name: row[0] })}><Trash2 size={14} /></button></div></td></tr>;
          })}</tbody></table>{filteredRows.length === 0 && <div className="admin-empty-state">No encontramos resultados con esa búsqueda.</div>}</div></div>
        </>}
      </div>
    </section>
    {dialog && !scheduleEditor && <Modal className={`admin-form-modal ${section === "Profesores" ? "teacher-modal" : section === "Cursos" ? "course-modal" : section === "Clases" ? "class-modal" : ""}`} labelledBy="admin-create-title" notice={toast} onDismiss={() => setDialog(false)}>
      <div className="admin-modal-heading"><div><span className="admin-eyebrow">{section.toUpperCase()}</span><h2 id="admin-create-title">{section === "Profesores" && editingTeacher ? "Editar profesor" : section === "Cursos" && editingCourseId ? "Editar curso" : section === "Rankings" && editingRankingId ? "Editar ranking" : actionLabel[section] || "Nuevo registro"}</h2><p>{section === "Alumnos" ? "Ingresa los datos del estudiante y asígnale su nivel." : section === "Profesores" ? "Asigna sus cursos, fija los honorarios de cada uno y marca su disponibilidad." : section === "Cursos" ? "Configura el programa completo de enseñanza: grupo, costo, fechas y horario." : section === "Clases" ? "Añade una sesión a uno de los cursos asociados al profesor." : section === "Rankings" ? "Define fecha, sede, aforo y tarifas para alumnos y público general." : "Completa los datos principales para continuar."}</p></div><button className="admin-icon-button" aria-label="Cerrar" onClick={() => { setDialog(false); setEditingCourseId(null); setEditingRankingId(null); }}><X size={18} /></button></div>
      <form onSubmit={saveRow}>
        {(section === "Alumnos" || section === "Profesores") && <>
          <label className="admin-form-label">Nombre y apellido<input autoFocus required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={section === "Alumnos" ? "Ej. Mateo Gonzales" : "Ej. Carlos Mendoza"} /></label>
          {section === "Alumnos" && <label className="admin-form-label">DNI<input required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" value={memberDni} onChange={(e) => setMemberDni(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="8 dígitos" /></label>}
          <div className="admin-form-grid"><label className="admin-form-label">Fecha de nacimiento<input type="date" required value={memberBirth} onChange={(e) => setMemberBirth(e.target.value)} /></label><label className="admin-form-label">Celular<input type="tel" required value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} placeholder="+51 987 654 321" /></label></div>
          <label className="admin-form-label">Correo electrónico<input type="email" required value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="nombre@correo.com" readOnly={!!editingTeacher} /></label>
          {!editingTeacher && <label className="admin-form-label">Contraseña inicial del portal<input type="password" autoComplete="new-password" required minLength={10} value={memberPassword} onChange={e=>setMemberPassword(e.target.value)} placeholder="Al menos 10 caracteres"/></label>}
          {section === "Alumnos" ? <label className="admin-form-label">Nivel<select value={memberLevel} onChange={(e) => setMemberLevel(e.target.value)}><option>Básico</option><option>Intermedio</option><option>Avanzado</option></select></label> : <>
            <AssignmentFields courses={courses} fees={fees} change={setFees}/>
            <MultiSelect label="Niveles que enseña" placeholder="Selecciona los niveles" options={["Básico", "Intermedio", "Avanzado"]} selected={teacherLevels} onChange={setTeacherLevels} emptyLabel="Elige al menos un nivel." required />
            <div className="teacher-calendar-wrap"><div className="teacher-calendar-heading"><div><strong>Disponibilidad semanal</strong><span>Selecciona bloques de dos horas por día</span></div><span>Horario recurrente</span></div><div className="teacher-calendar-scroll"><div className="teacher-calendar"><div className="teacher-calendar-corner">HORA</div>{teacherCalendarDays.map((day) => <div className="teacher-calendar-day" key={day.day}><strong>{day.day}</strong></div>)}{twoHourBlocks.map((block) => <div className="teacher-calendar-row" key={block}><div className="teacher-calendar-time">{block}<small>2 horas</small></div>{teacherCalendarDays.map((day) => { const key = `${day.day} ${day.date} · ${block}`; const selected = teacherSlots.includes(key); return <button type="button" aria-label={`${key}, ${selected ? "seleccionado" : "disponible"}`} aria-pressed={selected} className={`teacher-slot ${selected ? "selected" : ""}`} key={key} onClick={() => setTeacherSlots((current) => selected ? current.filter((slot) => slot !== key) : [...current, key])}>{selected && <CheckCircle2 size={15} />}</button>; })}</div>)}</div></div><div className="teacher-calendar-footer"><span>{teacherSlots.length} bloques seleccionados</span><strong>{teacherSlots.length * 2} h disponibles</strong></div></div>
          </>}
        </>}
        {section === "Cursos" && <>
          <label className="admin-form-label">Nombre del curso<input autoFocus required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ej. Fundamentos del tenis de mesa" /></label>
          <div className="admin-form-grid"><label className="admin-form-label">Nivel del curso<select value={courseLevel} onChange={(e) => setCourseLevel(e.target.value)}><option>Básico</option><option>Intermedio</option><option>Avanzado</option></select></label><label className="admin-form-label">Costo total del curso<div className="admin-money-input"><span>S/.</span><input type="number" min="0" step="0.01" required value={coursePrice} onChange={(e) => setCoursePrice(e.target.value)} placeholder="280.00" /></div></label></div>
          <div className="admin-form-grid"><label className="admin-form-label">Fecha de inicio<input type="date" required value={courseStarts} onChange={(e) => setCourseStarts(e.target.value)} /></label><label className="admin-form-label">Fecha de fin<input type="date" min={courseStarts || undefined} required value={courseEnds} onChange={(e) => setCourseEnds(e.target.value)} /></label></div>
          <MultiSelect label="Profesores asociados" placeholder="Selecciona profesores" options={rows.Profesores.map((row) => row[0])} selected={courseTeachers} onChange={setCourseTeachers} emptyLabel="Puedes asignar un profesor al crear su ficha." />
          <MultiSelect label="Participantes del curso" placeholder="Busca y selecciona alumnos" options={rows.Alumnos.map((row) => row[0])} selected={courseStudents} onChange={setCourseStudents} emptyLabel="Puedes matricular alumnos después." />
          <div className="course-schedule-card"><div><span className="course-schedule-icon"><CalendarDays size={18} /></span><div><strong>Horario semanal</strong><small>{courseSlots.length ? `${courseSlots.length} bloques · ${courseSlots.length * 2} horas por semana` : "Aún no has configurado días y horas"}</small></div></div><button type="button" className="admin-secondary-button" onClick={() => openCourseSchedule(null)}><CalendarClock size={16} /> Ver y editar horario</button></div>
        </>}
        {section === "Clases" && <>
          <label className="admin-form-label">Nombre de la clase o sesión<input autoFocus required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ej. Sesión 1 · Control de saque" /></label>
          <label className="admin-form-label">Curso asociado<select required value={classCourseId} onChange={(e) => { const course = courses.find((item) => item.id === e.target.value); setClassCourseId(e.target.value); setClassTeacher(course?.teachers[0] || ""); setClassDate(""); setClassTime(course?.slots[0] || ""); }}><option value="" disabled>Selecciona un curso</option>{courses.map((course) => <option value={course.id} key={course.id}>{course.name} · {course.level}</option>)}</select></label>
          {(() => { const course = courses.find((item) => item.id === classCourseId); const teachers = course?.teachers || []; const dates = course ? getCourseAvailableDates(course) : []; const availableDate = dates.includes(classDate) ? classDate : ""; const slots = course && availableDate ? getCourseSlotsForDate(course, availableDate) : []; const activeSlot = slots.includes(classTime) ? classTime : slots[0] || ""; return <><div className="admin-form-grid"><label className="admin-form-label">Profesor asociado<select required value={classTeacher} onChange={(e) => setClassTeacher(e.target.value)}>{teachers.map((teacher) => <option key={teacher}>{teacher}</option>)}</select></label><label className="admin-form-label">Fecha disponible<select required value={availableDate} onChange={(e) => { setClassDate(e.target.value); const nextSlots = course ? getCourseSlotsForDate(course, e.target.value) : []; setClassTime(nextSlots[0] || ""); }}><option value="">Selecciona una fecha programada</option>{dates.map((date) => <option key={date} value={date}>{formatLongDate(date)}</option>)}</select></label></div><label className="admin-form-label">Horario disponible<select required disabled={!availableDate} value={activeSlot} onChange={(e) => setClassTime(e.target.value)}>{slots.map((slot) => <option key={slot}>{slot}</option>)}</select></label>{course && !dates.length && <p className="class-schedule-empty">Este curso no tiene fechas futuras disponibles dentro de su vigencia.</p>}<div className="course-assignment-note"><Users size={16} /><span>Participantes vinculados al curso</span><strong>{course?.students.length || 0} alumnos</strong></div><p className="admin-form-hint">Solo puedes elegir fechas y horarios ya configurados en el curso.</p></>; })()}
        </>}
        {section === "Rankings" && <>
          <label className="admin-form-label">Nombre del ranking<input autoFocus required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ej. Torneo Relámpago Apertura" /></label>
          <div className="admin-form-grid"><label className="admin-form-label">Fecha<input type="date" required min={new Date().toLocaleDateString("sv-SE",{timeZone:"America/Lima"})} value={rankingDate} onChange={(e) => setRankingDate(e.target.value)} /></label><label className="admin-form-label">Hora<select value={rankingTime} onChange={(e) => setRankingTime(e.target.value)}>{["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "6:00 PM", "7:00 PM"].map((time) => <option key={time}>{time}</option>)}</select></label></div>
          <label className="admin-form-label">Lugar<input required value={rankingVenue} onChange={(e) => setRankingVenue(e.target.value)} placeholder="Dirección o sede del torneo" /></label>
          <div className="admin-form-grid"><label className="admin-form-label">Precio para alumnos<div className="admin-money-input"><span>S/.</span><input type="number" min="0" step="0.50" required value={rankingStudentPrice} onChange={(e) => setRankingStudentPrice(e.target.value)} placeholder="25.00" /></div></label><label className="admin-form-label">Precio para externos<div className="admin-money-input"><span>S/.</span><input type="number" min="0" step="0.50" required value={rankingPublicPrice} onChange={(e) => setRankingPublicPrice(e.target.value)} placeholder="40.00" /></div></label></div>
          <label className="admin-form-label">Aforo máximo<input type="number" min="2" max="200" required value={rankingCapacity} onChange={(e) => setRankingCapacity(e.target.value)} /></label>
          <div className="ranking-link-preview"><Link2 size={16} /><span>Al guardar se generará un enlace público de inscripción.</span></div>
        </>}
        {!( ["Alumnos", "Profesores", "Cursos", "Clases", "Rankings"] as Section[]).includes(section) && <><label className="admin-form-label">Nombre o título<input autoFocus required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={section === "Avisos" ? "Ej. Cambio de horario" : "Escribe un nombre"} /></label><label className="admin-form-label">Detalle<input value={formDetail} onChange={(e) => setFormDetail(e.target.value)} placeholder="Nivel, fecha, horario o información" /></label></>}
        <div className="admin-modal-actions"><button type="button" className="admin-secondary-button" onClick={() => { setDialog(false); setEditingCourseId(null); setEditingRankingId(null); }}>Cancelar</button><button type="submit" disabled={!opsReady||saving} className="admin-primary-button"><Plus size={16} />{section === "Cursos" ? editingCourseId ? "Guardar cambios" : "Crear curso" : section === "Clases" ? "Crear clase" : section === "Rankings" ? editingRankingId ? "Guardar cambios" : "Crear ranking" : "Guardar"}</button></div>
      </form></Modal>}
    {scheduleEditor && <Modal className="admin-form-modal course-modal schedule-editor-modal" labelledBy="schedule-editor-title" notice={toast} onDismiss={() => setScheduleEditor(null)}><div className="admin-modal-heading"><div><span className="admin-eyebrow">HORARIO SEMANAL</span><h2 id="schedule-editor-title">{scheduleEditor.step === "edit" ? "Ver y editar horario" : "Confirma el horario"}</h2><p>{scheduleEditor.step === "edit" ? "Marca bloques de dos horas. Revisa los cambios antes de aplicarlos." : "Verifica los días y horas que quedarán guardados en el curso."}</p></div><button className="admin-icon-button" aria-label="Cerrar" onClick={() => setScheduleEditor(null)}><X size={18} /></button></div>{scheduleEditor.step === "edit" ? <><div className="course-calendar-scroll"><div className="course-calendar"><div className="course-calendar-corner">INICIO</div>{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => <div className="course-weekday" key={day}>{day}</div>)}{twoHourBlocks.map((time) => <div className="course-calendar-row" key={time}><div className="course-time-label">{time}<small>2 horas</small></div>{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => { const key = `${day} · ${time}`; const selected = scheduleEditor.draft.includes(key); return <button key={key} type="button" aria-label={`${day}, ${time}`} aria-pressed={selected} className={`course-slot ${selected ? "selected" : ""}`} onClick={() => setScheduleEditor((current) => current ? { ...current, draft: selected ? current.draft.filter((slot) => slot !== key) : [...current.draft, key] } : current)}>{selected ? <CheckCircle2 size={14} /> : <Plus size={12} />}</button>; })}</div>)}</div></div><div className="teacher-calendar-footer"><span>{scheduleEditor.draft.length} bloques seleccionados</span><strong>{scheduleEditor.draft.length * 2} h / semana</strong></div><div className="admin-modal-actions"><button className="admin-secondary-button" onClick={() => setScheduleEditor(null)}>Cancelar</button><button className="admin-primary-button" onClick={confirmCourseSchedule}>Revisar cambios <ChevronRight size={16} /></button></div></> : <><div className="schedule-doublecheck"><span><CheckCircle2 size={20} /></span><div><strong>{scheduleEditor.draft.length} bloques · {scheduleEditor.draft.length * 2} horas semanales</strong><p>{scheduleEditor.draft.join(" · ")}</p></div></div><p className="admin-form-hint">Al confirmar, estas franjas definirán las fechas y horas disponibles para programar clases. Puedes volver a editarlas después.</p><div className="admin-modal-actions"><button className="admin-secondary-button" onClick={() => setScheduleEditor({ ...scheduleEditor, step: "edit" })}>Volver a editar</button><button className="admin-primary-button" onClick={confirmCourseSchedule}><Check size={16} />Confirmar horario</button></div></>}</Modal>}
    {editRecord && <Modal className="admin-form-modal generic-edit-modal" label="Editar registro" notice={toast} onDismiss={() => setEditRecord(null)}><div className="admin-modal-heading"><div><span className="admin-eyebrow">{editRecord.section.toUpperCase()}</span><h2>Editar registro</h2><p>Actualiza los datos y guarda los cambios.</p></div><button className="admin-icon-button" aria-label="Cerrar" onClick={() => setEditRecord(null)}><X size={18} /></button></div><form onSubmit={saveGenericEdit}>{editRecord.values.map((value, index) => <label className="admin-form-label" key={index}>{getColumnLabels(editRecord.section, editRecord.values)[index] || `Dato ${index + 1}`}<input readOnly={editRecord.section==="Alumnos" && index===6 || editRecord.section==="Clases" && !!savedLessons[editRecord.index] && index!==0} value={value} onChange={(e) => setEditRecord((current) => current ? { ...current, values: current.values.map((item, itemIndex) => itemIndex === index ? e.target.value : item) } : current)} /></label>)}<div className="admin-modal-actions"><button type="button" className="admin-secondary-button" onClick={() => setEditRecord(null)}>Cancelar</button><button className="admin-primary-button" type="submit"><Check size={16} />Guardar cambios</button></div></form></Modal>}
    {studentDetails && <Modal className="admin-form-modal enrollment-details-modal" labelledBy="student-enrollment-title" notice={toast} onDismiss={() => setStudentDetails(null)}><div className="admin-modal-heading"><div><span className="admin-eyebrow">DETALLE DE MATRÍCULA</span><h2 id="student-enrollment-title">{studentDetails[0]}</h2><p>DNI {studentDetails[1]} · {calculateAge(studentDetails[2])} años · Nivel {studentDetails[3]}</p></div><button className="admin-icon-button" aria-label="Cerrar" onClick={() => setStudentDetails(null)}><X size={18}/></button></div>{courses.filter((course) => course.students.includes(studentDetails[0])).length ? <div className="enrollment-course-list">{courses.filter((course) => course.students.includes(studentDetails[0])).map((course) => <article className="enrollment-course-card" key={course.id}><div className="enrollment-course-heading"><div><span>CURSO MATRICULADO</span><h3>{course.name}</h3></div><b>{course.level}</b></div><div className="enrollment-course-meta"><div><small>Vigencia hasta</small><strong>{formatLongDate(course.ends)}</strong></div><div><small>Cobrado a este alumno</small><strong>S/ {(finance.receipts.filter(r=>r.courseId===course.id && r.student===studentDetails[0]).reduce((n,r)=>n+r.cents,0)/100).toFixed(2)}</strong></div><div><small>Costo del curso</small><strong>S/. {Number(course.price).toFixed(2)}</strong></div></div><p className="enrollment-course-schedule">Horario: {course.slots.join(" · ")}</p></article>)}</div> : <div className="course-students-empty">Este alumno aún no está matriculado en un curso.</div>}<div className="admin-modal-actions"><button className="admin-primary-button" onClick={() => setStudentDetails(null)}>Listo</button></div></Modal>}
    {courseStudentsView && <Modal className="admin-form-modal course-students-modal" labelledBy="course-students-title" notice={toast} onDismiss={() => setCourseStudentsView(null)}><div className="admin-modal-heading"><div><span className="admin-eyebrow">DETALLE DEL CURSO</span><h2 id="course-students-title">{courseStudentsView.name}</h2><p>{courseStudentsView.students.length} alumnos · Nivel {courseStudentsView.level}</p></div><button className="admin-icon-button" aria-label="Cerrar" onClick={() => setCourseStudentsView(null)}><X size={18}/></button></div><div className="course-detail-summary"><div><small>Profesores</small><strong>{courseStudentsView.teachers.join(", ") || "Sin asignar"}</strong></div><div><small>Vigencia</small><strong>{formatLongDate(courseStudentsView.starts)} – {formatLongDate(courseStudentsView.ends)}</strong></div><div><small>Costo</small><strong>S/. {Number(courseStudentsView.price).toFixed(2)}</strong></div><div><small>Horario semanal</small><strong>{courseStudentsView.slots.join(" · ") || "Sin horario"}</strong></div></div><div className="course-students-label"><Users size={16}/> Alumnos matriculados</div><div className="course-student-list">{courseStudentsView.students.length ? courseStudentsView.students.map((name, i) => <article className="course-student-item" key={`${name}-${i}`}><span className="course-student-avatar">{name.split(" ").map((part) => part[0]).slice(0,2).join("")}</span><div><strong>{name}</strong><small>{courseStudentsView.level}</small></div><span className="course-student-schedule">{courseStudentsView.slots.join(" · ")}</span></article>) : <div className="course-students-empty">Aún no hay alumnos matriculados.</div>}</div><div className="admin-modal-actions"><button className="admin-primary-button" onClick={() => setCourseStudentsView(null)}>Cerrar</button></div></Modal>}
    {deleteRecord && <Modal className="admin-form-modal delete-confirm-modal" label="Eliminar registro" alert notice={toast} onDismiss={() => setDeleteRecord(null)}><div className="delete-confirm-icon"><Trash2 size={20} /></div><h2>¿Eliminar este registro?</h2><p><strong>{deleteRecord.name}</strong> se quitará de la tabla. Esta acción solo afecta los datos de demostración.</p><div className="admin-modal-actions"><button className="admin-secondary-button" onClick={() => setDeleteRecord(null)}>Cancelar</button><button className="admin-danger-button" onClick={confirmDeleteRecord}>Eliminar</button></div></Modal>}
    {toast && !(dialog || scheduleEditor || editRecord || studentDetails || courseStudentsView || deleteRecord) && <div role="status" className="admin-toast"><CheckCircle2 size={17} />{toast}<button onClick={() => setToast("")} aria-label="Cerrar"><X size={15} /></button></div>}
  </main>;
}

function sectionDescription(section: Section) { return ({ Alumnos: "Administra matrículas, niveles y membresías.", Profesores: "Organiza el equipo docente y sus especialidades.", Cursos: "Define el programa, los profesores, participantes, costo y horario semanal.", Clases: "Programa sesiones y asigna profesores y grupos.", Rankings: "Publica competencias y revisa las inscripciones.", Pagos: "Consulta renovaciones y pagos de los alumnos.", Avisos: "Comparte novedades con la comunidad de tu academia.", Resumen: "", "Mi academia": "" } as Record<Section, string>)[section]; }
function StatCard({ icon: Icon, label, value, delta, tone, data }: { icon: typeof Users; label: string; value: string; delta: string; tone: string; data: number[] }) { return <article className="admin-stat-card"><div className="stat-card-top"><span className={`stat-icon ${tone}`}><Icon size={18} /></span><button aria-label="Opciones" className="admin-more-button"><MoreHorizontal size={18} /></button></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><div className="stat-bottom"><span className="stat-delta"><ArrowUpRight size={13} />{delta}</span><div className={`mini-bars ${tone}`}>{data.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div></article>; }
function ActivityItem({ icon: Icon, title, detail, time, tone }: { icon: typeof Users; title: string; detail: string; time: string; tone: string }) { return <article className="activity-item"><span className={`activity-icon ${tone}`}><Icon size={16} /></span><div><strong>{title}</strong><p>{detail}</p></div><small>{time}</small></article>; }
function QuickAction({ icon: Icon, title, detail, onClick }: { icon: typeof Users; title: string; detail: string; onClick: () => void }) { return <button className="quick-action" onClick={onClick}><span><Icon size={18} /></span><strong>{title}</strong><small>{detail}</small><ChevronRight size={15} /></button>; }
function MultiSelect({ label, placeholder, options, selected, onChange, emptyLabel, required = false }: { label: string; placeholder: string; options: string[]; selected: string[]; onChange: (values: string[]) => void; emptyLabel: string; required?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = options.filter((option) => option.toLowerCase().includes(query.toLowerCase()));
  function toggle(value: string) { onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]); }
  return <div className={`multi-select ${open ? "open" : ""}`}>
    {label && <div className="multi-select-label"><span>{label}</span><small>{selected.length ? `${selected.length} seleccionados` : required ? "Requerido" : "Opcional"}</small></div>}
    {selected.length > 0 && <div className="multi-select-chips">{selected.map((value) => <span className="multi-select-chip" key={value}>{value}<button type="button" aria-label={`Quitar ${value}`} onClick={() => toggle(value)}><X size={12} /></button></span>)}</div>}
    <button type="button" className="multi-select-trigger" aria-expanded={open} onClick={() => setOpen((value) => !value)}><Users size={16} /><span>{selected.length ? "Agregar otra opción" : placeholder}</span><ChevronDown size={15} /></button>
    {open && <div className="multi-select-menu"><label className="multi-select-search"><Search size={14} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar opciones..." /></label><div className="multi-select-options">{filtered.length ? filtered.map((option) => { const checked = selected.includes(option); return <button type="button" key={option} className={`multi-select-option ${checked ? "selected" : ""}`} aria-pressed={checked} onClick={() => toggle(option)}><span className="multi-select-check">{checked && <CheckCircle2 size={13} />}</span>{option}</button>; }) : <div className="multi-select-empty">{options.length ? "Sin coincidencias." : emptyLabel}</div>}</div></div>}
  </div>;
}
function RankingManager({ ranking, academyStudents, onBack, onToast, onChange }: { ranking: Ranking; academyStudents: AcademyStudent[]; onBack: () => void; onToast: (message: string) => void; onChange: (ranking: Ranking) => Promise<boolean> }) {
  const [manualDni, setManualDni] = useState("");
  const [manualName, setManualName] = useState("");
  const [copyDone, setCopyDone] = useState(false);
  const [requestedGroups,setRequestedGroups]=useState(0);
  const paidCount = ranking.participants.filter((item) => item.paid).length;
  const minimumGroups=Math.ceil(paidCount/5),maximumGroups=Math.floor(paidCount/2);
  const groupCount=Math.min(maximumGroups,Math.max(minimumGroups,requestedGroups));
  const publicLink = typeof window === "undefined" ? `/ranking/${ranking.id}` : `${window.location.origin}/ranking/${ranking.id}`;
  const matchedStudent = academyStudents.find((student) => student.dni === manualDni);
  const manualValidDni = /^\d{8}$/.test(manualDni);
  function updateParticipant(id: string, changes: Partial<RankingParticipant>) {
    onChange({ ...ranking, participants: ranking.participants.map((item) => item.id === id ? { ...item, ...changes } : item) });
  }
  async function addParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ranking.participants.length >= ranking.capacity) { onToast("El ranking alcanzó el aforo máximo"); return; }
    if (!manualValidDni) { onToast("Ingresa un DNI válido de 8 dígitos"); return; }
    const cleanName = (matchedStudent?.name || manualName).trim();
    if (!cleanName) { onToast("Ingresa el nombre del participante externo"); return; }
    if (ranking.participants.some((item) => item.dni === manualDni || item.name.toLowerCase() === cleanName.toLowerCase())) { onToast("Este participante ya está inscrito o pendiente"); return; }
    const participant: RankingParticipant = { id: crypto.randomUUID(), name: cleanName, dni: manualDni, kind: matchedStudent ? "Alumno" : "Externo", paid: (matchedStudent ? ranking.studentPrice : ranking.publicPrice)===0, weight: 5 };
    if(!await onChange({ ...ranking, participants: [...ranking.participants, participant] }))return;
    setManualDni(""); setManualName("");
    onToast(`Participante registrado · tarifa ${participant.kind === "Alumno" ? "de academia" : "externa"}`);
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(publicLink); setCopyDone(true); window.setTimeout(() => setCopyDone(false), 1800); onToast("Enlace copiado"); }
    catch { onToast("Copia este enlace desde el campo de inscripción"); }
  }
  async function generateGroups() {
    const sorted = ranking.participants.filter((item) => item.paid).sort((a, b) => a.weight - b.weight || a.name.localeCompare(b.name, "es"));
    if (sorted.length<2) { onToast("Confirma el pago de al menos dos participantes para generar grupos"); return; }
    const next: RankingParticipant[] = ranking.participants.map((item) => ({ ...item, group: undefined }));

    sorted.forEach((participant, index) => {
      const round = Math.floor(index / groupCount);
      const offset = index % groupCount;
      const group = round % 2 === 0 ? offset + 1 : groupCount - offset;
      const entry = next.find((item) => item.id === participant.id);
      if (entry) entry.group = group;
    });
    if(!await onChange({ ...ranking, participants: [...sorted.map(p=>next.find(n=>n.id===p.id)!),...next.filter(p=>!p.paid)] }))return;
    onToast(`${groupCount} grupo(s) generado(s), máximo 5 participantes por grupo`);
  }
  const groups = Array.from(new Set(ranking.participants.filter((item) => item.paid && item.group).map((item) => item.group as number))).sort((a, b) => a - b);
  return <div className="ranking-admin-view">
    <button className="back-link ranking-back" onClick={onBack}><ChevronRight className="back-chevron" size={16} /> Volver a rankings</button>
    <div className="admin-page-heading"><div><span className="admin-eyebrow">GESTIÓN DE COMPETENCIA</span><h1>{ranking.title}</h1><p>{formatLongDate(ranking.date)} · {ranking.time} · {ranking.venue}</p>{ranking.id === "ranking-14" && <span className="demo-rank-badge">DATOS DE PRUEBA · 20 PARTICIPANTES</span>}</div><button className="admin-secondary-button" onClick={copyLink}><Copy size={15} />{copyDone ? "Copiado" : "Copiar enlace"}</button></div>
    <div className="ranking-admin-stats"><div><span>Inscritos</span><strong>{ranking.participants.length} <small>/ {ranking.capacity}</small></strong></div><div><span>Pagos confirmados</span><strong>{paidCount}</strong></div><div><span>Tarifa alumno</span><strong>S/. {ranking.studentPrice.toFixed(2)}</strong></div><div><span>Tarifa externo</span><strong>S/. {ranking.publicPrice.toFixed(2)}</strong></div></div>
    <details className="ranking-entries" open={groups.length===0}><summary>Inscripciones y participantes <span>{ranking.participants.length}</span></summary><section className="admin-panel-card ranking-share-card"><div className="ranking-share-icon"><Link2 size={18} /></div><div><strong>Enlace público de inscripción</strong><p>Alumnos y externos completan su inscripción desde esta página. El cupo se confirma después del pago.</p><code>{publicLink}</code></div><a href={publicLink} target="_blank" rel="noreferrer" className="row-action" aria-label="Abrir enlace"><ExternalLink size={16} /></a></section>
    <div className="ranking-registration-layout"><section className="admin-panel-card ranking-participants-card"><div className="admin-card-heading"><div><h2>Participantes</h2><p>Separa alumnos y externos; asigna peso del 1 al 5 para sembrar grupos.</p></div><span className="course-selected-count">{ranking.participants.length} / {ranking.capacity}</span></div>
      <form className="ranking-add-participant" onSubmit={addParticipant}><label className="admin-form-label">DNI<input required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" value={manualDni} onChange={(e) => { setManualDni(e.target.value.replace(/\D/g, "").slice(0, 8)); setManualName(""); }} placeholder="8 dígitos" /></label>{manualValidDni && (matchedStudent ? <div className="ranking-dni-match"><CheckCircle2 size={15} /><span><strong>{matchedStudent.name}</strong><small>Alumno de la academia</small></span></div> : <label className="admin-form-label">Nombre del externo<input required value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Nombre y apellido" /></label>)}<div className="ranking-price-preview"><span>{matchedStudent ? "Tarifa alumno" : manualValidDni ? "Tarifa externo" : "Tarifa"}</span><strong>S/. {(matchedStudent ? ranking.studentPrice : ranking.publicPrice).toFixed(2)}</strong></div><button className="admin-primary-button" type="submit" disabled={ranking.participants.length >= ranking.capacity || !manualValidDni || (!matchedStudent && !manualName.trim())}><CirclePlus size={16} />Agregar participante</button></form>
      <div className="ranking-participant-table"><div className="ranking-participant-head"><span>PARTICIPANTE</span><span>TIPO / TARIFA</span><span>PESO</span><span>PAGO</span><span>GRUPO</span><span /></div>{ranking.participants.map((person) => <div className="ranking-participant-row" key={person.id}><div><strong>{person.name}</strong><small>{person.dni ? `DNI ${person.dni}` : person.kind}</small></div><div><span>S/. {(person.kind === "Alumno" ? ranking.studentPrice : ranking.publicPrice).toFixed(2)}</span></div><label className="ranking-weight-field"><span className="sr-only">Peso de {person.name}</span><select value={person.weight} onChange={(e) => updateParticipant(person.id, { weight: Number(e.target.value), group: undefined })}>{[1, 2, 3, 4, 5].map((weight) => <option key={weight} value={weight}>{weight}{weight === 1 ? " · mejor" : ""}</option>)}</select></label><span className={`payment-state ${person.paid ? "paid" : "pending"}`}><i />{person.paid ? "Pagado" : "Pendiente"}</span><span className="ranking-group-cell">{person.group ? `Grupo ${groupLabel(person.group)}` : "—"}</span>{!person.paid && <button type="button" className="admin-secondary-button" onClick={()=>updateParticipant(person.id,{paid:true})}>Confirmar pago</button>}</div>)}</div>
      <p className="ranking-seed-note"><Trophy size={15} /> Peso 1 es el mejor sembrado; peso 5 es el último. Solo participantes con pago confirmado entran en los grupos.</p>
    </section></div></details>
    <section className="ops-card group-editor"><header className="sheet-heading"><div><h2>Distribución de jugadores</h2><p>{groups.length?"Grupos en edición":"Genera una distribución inicial a partir de la siembra."}</p></div>{paidCount>=2 && <label>Número de grupos <select value={groupCount} onChange={e=>setRequestedGroups(Number(e.target.value))}>{Array.from({length:maximumGroups-minimumGroups+1},(_,i)=>i+minimumGroups).map(n=><option key={n}>{n}</option>)}</select></label>}<button className="admin-secondary-button" disabled={paidCount<2} onClick={generateGroups}>{groups.length?"Volver a distribuir":"Generar grupos"}</button></header>
    {!!groups.length && <GroupBoard players={ranking.participants} onChange={participants=>onChange({...ranking,participants})}/>}</section>
  </div>;
}

function courseToRow(course: Course): string[] { return [course.name, course.level, `${course.students.length} alumnos`, course.teachers.join(", "), `${formatAdminDate(course.starts)} – ${formatAdminDate(course.ends)}`, `S/. ${Number(course.price).toFixed(2)}`, course.slots.join(" · ")]; }
function rankingToRow(ranking: Ranking): string[] {
  const status = new Date(`${ranking.date}T23:59:59`).getTime() < Date.now() ? "Finalizado" : "Inscripción abierta";
  return [ranking.title, `${formatAdminDate(ranking.date)} · ${ranking.time}`, `${ranking.participants.length} / ${ranking.capacity} inscritos`, status];
}
function formatAdminDate(value: string) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }).replace(".", "") : "—"; }
function formatLongDate(value: string) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Selecciona una fecha"; }
function calculateAge(birth: string) {
  if(!birth)return "—";
  if (!birth) return "—";
  const date = new Date(`${birth}T12:00:00`); if (Number.isNaN(date.getTime())) return "—";
  const now = new Date(); let age = now.getFullYear() - date.getFullYear();
  if (now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())) age--;
  return age;
}
function getCourseSlotsForDate(course: Course, dateValue: string) {
  if (!dateValue) return [];
  const weekday = weekdayCodes[new Date(`${dateValue}T12:00:00`).getDay()];
  return course.slots.filter((slot) => slot.startsWith(`${weekday} ·`) || slot.startsWith(`${weekday} `));
}
function getCourseAvailableDates(course: Course) {
  if (!course.starts || !course.ends || !course.slots.length) return [];
  const start = new Date(`${course.starts}T12:00:00`), end = new Date(`${course.ends}T12:00:00`), today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(Math.max(start.getTime(), today.getTime())), dates: string[] = [];
  for (; cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const day = weekdayCodes[cursor.getDay()];
    if (course.slots.some((slot) => slot.startsWith(`${day} ·`) || slot.startsWith(`${day} `))) dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`);
  }
  return dates;
}
function getColumnLabels(section: Section, values: string[]) {
  if (section === "Alumnos") return ["Nombre y apellido", "DNI", "Fecha de nacimiento", "Nivel", "Correo", "Celular", "Estado"];
  if (section === "Profesores") return ["Nombre y apellido", "Fecha de nacimiento", "Niveles que enseña", "Correo", "Celular", "Disponibilidad"];
  if (section === "Clases") return ["Nombre de la clase", "Curso asociado", "Fecha y hora", "Profesor", "Participantes"];
  if (section === "Pagos") return ["Alumno", "Concepto", "Monto", "Estado"];
  return values.map((_, index) => `Dato ${index + 1}`);
}
