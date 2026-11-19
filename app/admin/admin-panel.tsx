"use client";

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
  Alumnos: [["Mateo Gonzales", "10000001", "2010-06-12", "Intermedio", "mateo@correo.com", "+51 987 654 321", "Activo"], ["Vanessa Cárdenas", "10000002", "2009-03-25", "Avanzado", "vanessa@correo.com", "+51 986 331 221", "Activo"], ["Diego Vásquez", "10000003", "2011-08-04", "Básico", "diego@correo.com", "+51 973 108 765", "Por renovar"], ["Nicole Torres", "10000004", "2010-11-19", "Intermedio", "nicole@correo.com", "+51 960 444 532", "Activo"]],
  Profesores: [["Carlos Mendoza", "1987-09-07", "Intermedio · Avanzado", "carlos@spinacademy.pe", "+51 987 332 100", "Lun, Mié · 6:00 PM"], ["Raúl Peña", "1990-02-14", "Básico · Intermedio", "raul@spinacademy.pe", "+51 985 821 104", "Mar, Sáb · 10:00 AM"], ["Lucía Salazar", "1993-12-03", "Básico", "lucia@spinacademy.pe", "+51 989 210 611", "Jue · 4:00 PM"]],
  Cursos: [["Fundamentos de juego", "Básico", "6 alumnos", "Raúl Peña", "01 nov – 20 dic", "S/. 480.00", "Mié · 4:00 PM"], ["Control de saques & Topspin", "Intermedio", "8 alumnos", "Carlos Mendoza", "03 nov – 22 dic", "S/. 560.00", "Lun · 6:00 PM"], ["Técnica avanzada", "Avanzado", "5 alumnos", "Lucía Salazar", "07 nov – 26 dic", "S/. 640.00", "Sáb · 10:00 AM"]],
  Clases: [["Fundamentos de juego · Sesión 4", "Fundamentos de juego", "Mié 18 nov · 4:00 PM", "Raúl Peña", "6 alumnos"], ["Control de saques · Sesión 5", "Control de saques & Topspin", "Lun 23 nov · 6:00 PM", "Carlos Mendoza", "8 alumnos"], ["Técnica avanzada · Sesión 3", "Técnica avanzada", "Sáb 21 nov · 10:00 AM", "Lucía Salazar", "5 alumnos"]],
  Rankings: [["Torneo Relámpago #14", "21 nov · 4:00 PM", "5 / 20 inscritos", "Inscripción abierta"], ["Ranking Semanal #15", "28 nov · 3:00 PM", "2 / 20 inscritos", "Inscripción abierta"]],
  Pagos: [["Mateo Gonzales", "Plan competitivo", "S/. 280.00", "Pagado · 20 oct"], ["Diego Vásquez", "Plan mensual", "S/. 180.00", "Pendiente"], ["Nicole Torres", "Plan competitivo", "S/. 280.00", "Pagado · 19 oct"]],
  Avisos: [["Ajuste de horario · Miércoles", "Publicado hoy · 9:15 AM", "Todos los alumnos", "Publicado"], ["Mantenimiento de mesas", "10 nov · 4:30 PM", "Sede Miraflores", "Archivado"]],
};
const actionLabel: Partial<Record<Section, string>> = { Alumnos: "Agregar alumno", Profesores: "Agregar profesor", Cursos: "Crear curso", Clases: "Programar clase", Rankings: "Crear ranking", Avisos: "Publicar aviso" };
const teacherCalendarDays = [{ day: "Lun", date: "17" }, { day: "Mar", date: "18" }, { day: "Mié", date: "19" }, { day: "Jue", date: "20" }, { day: "Vie", date: "21" }, { day: "Sáb", date: "22" }, { day: "Dom", date: "23" }];
const weekdayCodes = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const twoHourBlocks = ["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];
const initialCourses: Course[] = [
  { id: "course-basico", name: "Fundamentos de juego", level: "Básico", teachers: ["Raúl Peña"], students: ["Mateo Gonzales", "Vanessa Cárdenas", "Diego Vásquez", "Nicole Torres", "Lucía Rojas", "Andrés Paredes"], price: "480", starts: "2026-11-01", ends: "2026-12-20", slots: ["Mié · 4:00 PM"] },
  { id: "course-intermedio", name: "Control de saques & Topspin", level: "Intermedio", teachers: ["Carlos Mendoza"], students: ["Mateo Gonzales", "Vanessa Cárdenas", "Nicole Torres", "Lucía Rojas", "Andrés Paredes", "Camila Torres", "Bruno Salas", "Paola Núñez"], price: "560", starts: "2026-11-03", ends: "2026-12-22", slots: ["Lun · 6:00 PM"] },
  { id: "course-avanzado", name: "Técnica avanzada", level: "Avanzado", teachers: ["Lucía Salazar"], students: ["Vanessa Cárdenas", "Nicole Torres", "Lucía Rojas", "Andrés Paredes", "Paola Núñez"], price: "640", starts: "2026-11-07", ends: "2026-12-26", slots: ["Sáb · 10:00 AM"] },
];
const initialRankings: Ranking[] = [
  { id: "ranking-14", title: "Torneo Relámpago #14 · Grupos de prueba", date: "2026-11-21", time: "4:00 PM", venue: "Av. Precursores 241 · San Miguel", studentPrice: 25, publicPrice: 40, capacity: 20, participants: [
    { id: "demo-01", name: "Vanessa Cárdenas", kind: "Alumno", dni: "10000002", paid: true, weight: 1, group: 1 }, { id: "demo-02", name: "Mateo Gonzales", kind: "Alumno", dni: "10000001", paid: true, weight: 2, group: 1 }, { id: "demo-03", name: "Carlos Ramos", kind: "Externo", dni: "20000001", paid: true, weight: 3, group: 1 }, { id: "demo-04", name: "Lucía Rojas", kind: "Alumno", dni: "10000005", paid: true, weight: 4, group: 1 }, { id: "demo-05", name: "Pedro Castillo", kind: "Externo", dni: "20000002", paid: true, weight: 5, group: 1 },
    { id: "demo-06", name: "Nicole Torres", kind: "Alumno", dni: "10000004", paid: true, weight: 1, group: 2 }, { id: "demo-07", name: "Diego Vásquez", kind: "Alumno", dni: "10000003", paid: true, weight: 2, group: 2 }, { id: "demo-08", name: "Andrea Ponce", kind: "Externo", dni: "20000003", paid: true, weight: 3, group: 2 }, { id: "demo-09", name: "Andrés Paredes", kind: "Alumno", dni: "10000006", paid: true, weight: 4, group: 2 }, { id: "demo-10", name: "Jorge Rivas", kind: "Externo", dni: "20000004", paid: true, weight: 5, group: 2 },
    { id: "demo-11", name: "Camila Torres", kind: "Alumno", dni: "10000007", paid: true, weight: 1, group: 3 }, { id: "demo-12", name: "Raúl León", kind: "Externo", dni: "20000005", paid: true, weight: 2, group: 3 }, { id: "demo-13", name: "Bruno Salas", kind: "Alumno", dni: "10000008", paid: true, weight: 3, group: 3 }, { id: "demo-14", name: "María Vega", kind: "Externo", dni: "20000006", paid: true, weight: 4, group: 3 }, { id: "demo-15", name: "Paola Núñez", kind: "Alumno", dni: "10000009", paid: true, weight: 5, group: 3 },
    { id: "demo-16", name: "Tomás Flores", kind: "Externo", dni: "20000007", paid: true, weight: 1, group: 4 }, { id: "demo-17", name: "Esteban Ruiz", kind: "Alumno", dni: "10000010", paid: true, weight: 2, group: 4 }, { id: "demo-18", name: "Sofía Campos", kind: "Externo", dni: "20000008", paid: true, weight: 3, group: 4 }, { id: "demo-19", name: "Daniel Soto", kind: "Alumno", dni: "10000011", paid: true, weight: 4, group: 4 }, { id: "demo-20", name: "Miguel Herrera", kind: "Externo", dni: "20000009", paid: true, weight: 5, group: 4 },
  ] },
  { id: "ranking-15", title: "Ranking Semanal #15", date: "2026-11-28", time: "3:00 PM", venue: "Sede Miraflores · Lima", studentPrice: 25, publicPrice: 40, capacity: 20, participants: [
    { id: "p-6", name: "Mateo Gonzales", kind: "Alumno", paid: true, weight: 1 }, { id: "p-7", name: "Vanessa Cárdenas", kind: "Alumno", paid: true, weight: 2 }, { id: "p-8", name: "Invitado externo", kind: "Externo", paid: false, weight: 5 },
  ] },
];

export default function AdminPanel() {
  const [section, setSection] = useState<Section>("Resumen");
  const [rows, setRows] = useState(initialRows);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [rankings, setRankings] = useState<Ranking[]>(initialRankings);
  const [rankingsLoaded, setRankingsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editRecord, setEditRecord] = useState<{ section: Section; index: number; values: string[] } | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<{ section: Section; index: number; name: string } | null>(null);
  const [studentDetails, setStudentDetails] = useState<string[] | null>(null);
  const [courseStudentsView, setCourseStudentsView] = useState<Course | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingRankingId, setEditingRankingId] = useState<string | null>(null);
  const [activeRankingId, setActiveRankingId] = useState<string | null>(null);
  const [scheduleEditor, setScheduleEditor] = useState<{ courseId: string | null; draft: string[]; step: "edit" | "confirm" } | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [academyName, setAcademyName] = useState("SpinAcademy Miraflores");
  const [brandColor, setBrandColor] = useState("#0b50c8");
  const [logoUrl, setLogoUrl] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDetail, setFormDetail] = useState("");
  const [memberBirth, setMemberBirth] = useState("");
  const [memberDni, setMemberDni] = useState("");
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
  const [classCourseId, setClassCourseId] = useState(initialCourses[0].id);
  const [classTeacher, setClassTeacher] = useState(initialCourses[0].teachers[0]);
  const [classDate, setClassDate] = useState("");
  const [classTime, setClassTime] = useState(initialCourses[0].slots[0]);
  const [rankingDate, setRankingDate] = useState("");
  const [rankingTime, setRankingTime] = useState("4:00 PM");
  const [rankingVenue, setRankingVenue] = useState("");
  const [rankingStudentPrice, setRankingStudentPrice] = useState("");
  const [rankingPublicPrice, setRankingPublicPrice] = useState("");
  const [rankingCapacity, setRankingCapacity] = useState("20");
  const [dateRange, setDateRange] = useState("Últimos 30 días");
  useEffect(() => {
    fetch("/api/academy/settings").then(async (response) => { if (!response.ok) return; const data = await response.json(); const academy = data.academy; if (!academy) return; setAcademyName(academy.name); setBrandColor(academy.primaryColor); setLogoUrl(academy.logoUrl || ""); }).catch(() => undefined);
  }, []);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ttacademias:rankings");
      if (saved) {
        const parsed = JSON.parse(saved) as Ranking[];
        if (Array.isArray(parsed)) {
          const demo = parsed.find((item) => item.id === "ranking-14");
          const migrated = demo && demo.participants.length !== 20 ? parsed.map((item) => item.id === "ranking-14" ? initialRankings[0] : item) : parsed;
          setRankings(migrated);
          setRows((current) => ({ ...current, Rankings: migrated.map((item) => rankingToRow(item)) }));
          if (migrated !== parsed) window.localStorage.setItem("ttacademias:rankings", JSON.stringify(migrated));
        }
      }
    } catch { /* Keep the local sample rankings if browser storage is unavailable. */ }
    setRankingsLoaded(true);
  }, []);
  useEffect(() => {
    function syncRankings(event: StorageEvent) {
      if (event.key !== "ttacademias:rankings" || !event.newValue) return;
      try {
        const next = JSON.parse(event.newValue) as Ranking[];
        if (!Array.isArray(next)) return;
        setRankings(next);
        setRows((current) => ({ ...current, Rankings: next.map(rankingToRow) }));
      } catch { /* Ignore malformed data from another browser tab. */ }
    }
    window.addEventListener("storage", syncRankings);
    return () => window.removeEventListener("storage", syncRankings);
  }, []);
  useEffect(() => {
    if (rankingsLoaded) window.localStorage.setItem("ttacademias:rankings", JSON.stringify(rankings));
  }, [rankings, rankingsLoaded]);
  useEffect(() => {
    window.localStorage.setItem("ttacademias:academy-students", JSON.stringify(rows.Alumnos.map((row) => ({ name: row[0], dni: row[1] }))));
  }, [rows.Alumnos]);
  const filteredRows = useMemo(() => {
    if (!(section in rows)) return [];
    const table = rows[section as keyof typeof rows];
    return table.filter((row) => row.join(" ").toLowerCase().includes(search.toLowerCase()));
  }, [rows, section, search]);
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
  function saveRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!(section in rows)) return;
    if (section === "Alumnos") {
      if (!/^\d{8}$/.test(memberDni)) { notify("Ingresa un DNI válido de 8 dígitos"); return; }
      if (rows.Alumnos.some((student) => student[1] === memberDni)) { notify("Ya existe un alumno con ese DNI"); return; }
      const row = [formTitle, memberDni, memberBirth, memberLevel, memberEmail, memberPhone, "Activo"];
      setRows((current) => ({ ...current, Alumnos: [row, ...current.Alumnos] }));
    } else if (section === "Profesores") {
      if (!teacherLevels.length || !teacherSlots.length) { notify("Selecciona los niveles que enseña y al menos un bloque disponible"); return; }
      const row = [formTitle, memberBirth, teacherLevels.join(" · "), memberEmail, memberPhone, teacherSlots.join(" · ")];
      setRows((current) => ({ ...current, Profesores: [row, ...current.Profesores] }));
    } else if (section === "Cursos") {
      if (!courseTeachers.length || !courseStudents.length || !courseSlots.length || !coursePrice || !courseStarts || !courseEnds) { notify("Completa profesores, participantes, precio, fechas y al menos un horario"); return; }
      if (courseEnds < courseStarts) { notify("La fecha de fin debe ser posterior a la fecha de inicio"); return; }
      const currentCourse = courses.find((course) => course.id === editingCourseId);
      const course: Course = { id: currentCourse?.id || `course-${Date.now()}`, name: formTitle, level: courseLevel, teachers: courseTeachers, students: courseStudents, price: coursePrice, starts: courseStarts, ends: courseEnds, slots: courseSlots };
      const row = courseToRow(course);
      if (currentCourse) {
        const index = courses.findIndex((item) => item.id === currentCourse.id);
        setCourses((current) => current.map((item) => item.id === course.id ? course : item));
        setRows((current) => ({ ...current, Cursos: current.Cursos.map((item, itemIndex) => itemIndex === index ? row : item) }));
      } else {
        setCourses((current) => [...current, course]);
        setRows((current) => ({ ...current, Cursos: [...current.Cursos, row] }));
      }
    } else if (section === "Clases") {
      const course = courses.find((item) => item.id === classCourseId);
      if (!course || !course.teachers.includes(classTeacher)) { notify("Selecciona un profesor asociado al curso"); return; }
      if (!classDate || !classTime) { notify("Selecciona una fecha y un horario disponibles del curso"); return; }
      const dateOptions = getCourseAvailableDates(course);
      if (!dateOptions.includes(classDate)) { notify("Elige una de las fechas programadas dentro de la vigencia del curso"); return; }
      const weekday = weekdayCodes[new Date(`${classDate}T12:00:00`).getDay()];
      if (!(classTime.startsWith(`${weekday} ·`) || classTime.startsWith(`${weekday} `))) { notify("El horario no corresponde a la fecha elegida"); return; }
      const row = [formTitle, course.name, `${formatAdminDate(classDate)} · ${classTime}`, classTeacher, `${course.students.length} alumnos`];
      setRows((current) => ({ ...current, Clases: [row, ...current.Clases] }));
    } else if (section === "Rankings") {
      if (!rankingDate || !rankingVenue || !rankingStudentPrice || !rankingPublicPrice || !rankingCapacity) { notify("Completa fecha, sede, precios y aforo"); return; }
      const editedRanking = rankings.find((item) => item.id === editingRankingId);
      const ranking: Ranking = { id: editedRanking?.id || `ranking-${Date.now()}`, title: formTitle, date: rankingDate, time: rankingTime, venue: rankingVenue, studentPrice: Number(rankingStudentPrice), publicPrice: Number(rankingPublicPrice), capacity: Number(rankingCapacity), participants: editedRanking?.participants || [] };
      if (ranking.capacity < ranking.participants.length) { notify("El aforo no puede ser menor a los inscritos actuales"); return; }
      if (editedRanking) {
        const index = rankings.findIndex((item) => item.id === editedRanking.id);
        setRankings((current) => current.map((item) => item.id === ranking.id ? ranking : item));
        setRows((current) => ({ ...current, Rankings: current.Rankings.map((item, itemIndex) => itemIndex === index ? rankingToRow(ranking) : item) }));
      } else {
        setRankings((current) => [ranking, ...current]);
        setRows((current) => ({ ...current, Rankings: [rankingToRow(ranking), ...current.Rankings] }));
      }
    } else {
      const row = [formTitle, formDetail || "Nuevo registro", "Por configurar", "Activo"];
      setRows((current) => ({ ...current, [section]: [row, ...current[section as keyof typeof current]] }));
    }
    setFormTitle(""); setFormDetail(""); setMemberBirth(""); setMemberDni(""); setMemberEmail(""); setMemberPhone(""); setTeacherSlots([]); setTeacherLevels([]); setCourseLevel("Intermedio"); setCourseTeachers([]); setCourseStudents([]); setCourseSlots([]); setCoursePrice(""); setCourseStarts(""); setCourseEnds(""); setClassDate(""); setRankingDate(""); setRankingVenue(""); setEditingCourseId(null); setEditingRankingId(null); setDialog(false);
    notify(section === "Cursos" ? editingCourseId ? "Curso actualizado" : "Curso creado" : section === "Clases" ? "Clase añadida al curso" : section === "Rankings" ? editingRankingId ? "Ranking actualizado" : "Ranking creado · ya puedes compartir su enlace" : "Registro agregado en esta demostración");
  }
  function openCourseSchedule(course: Course | null) {
    setScheduleEditor({ courseId: course?.id || null, draft: [...(course?.slots || courseSlots)], step: "edit" });
  }
  function confirmCourseSchedule() {
    if (!scheduleEditor) return;
    if (!scheduleEditor.draft.length) { notify("Selecciona al menos un bloque semanal"); return; }
    if (scheduleEditor.step === "edit") { setScheduleEditor({ ...scheduleEditor, step: "confirm" }); return; }
    if (scheduleEditor.courseId) {
      const course = courses.find((item) => item.id === scheduleEditor.courseId);
      if (course) {
        const updated = { ...course, slots: scheduleEditor.draft };
        const index = courses.findIndex((item) => item.id === course.id);
        setCourses((current) => current.map((item) => item.id === course.id ? updated : item));
        setRows((current) => ({ ...current, Cursos: current.Cursos.map((row, rowIndex) => rowIndex === index ? courseToRow(updated) : row) }));
      }
    } else setCourseSlots(scheduleEditor.draft);
    setScheduleEditor(null);
    notify("Horario confirmado y actualizado");
  }
  function openEditRecord(target: Section, row: string[]) {
    const index = (rows[target as keyof typeof rows] as string[][]).indexOf(row);
    if (target === "Cursos") {
      const course = courses[index];
      if (!course) return;
      setEditingCourseId(course.id); setFormTitle(course.name); setCourseLevel(course.level); setCourseTeachers([...course.teachers]); setCourseStudents([...course.students]); setCoursePrice(course.price); setCourseStarts(course.starts); setCourseEnds(course.ends); setCourseSlots([...course.slots]); setSection("Cursos"); setDialog(true);
    } else if (target === "Rankings") {
      const ranking = rankings[index];
      if (!ranking) return;
      setEditingRankingId(ranking.id); setFormTitle(ranking.title); setRankingDate(ranking.date); setRankingTime(ranking.time); setRankingVenue(ranking.venue); setRankingStudentPrice(String(ranking.studentPrice)); setRankingPublicPrice(String(ranking.publicPrice)); setRankingCapacity(String(ranking.capacity)); setSection("Rankings"); setDialog(true);
    } else setEditRecord({ section: target, index, values: [...row] });
  }
  function confirmDeleteRecord() {
    if (!deleteRecord) return;
    const { section: target, index } = deleteRecord;
    setRows((current) => ({ ...current, [target]: (current[target as keyof typeof current] as string[][]).filter((_, rowIndex) => rowIndex !== index) }));
    if (target === "Cursos") { const removed = courses[index]; setCourses((current) => current.filter((_, rowIndex) => rowIndex !== index)); if (removed) setClassCourseId((current) => current === removed.id ? courses[index + 1]?.id || courses[index - 1]?.id || "" : current); }
    if (target === "Rankings") { const removed = rankings[index]; setRankings((current) => current.filter((_, rowIndex) => rowIndex !== index)); if (removed?.id === activeRankingId) setActiveRankingId(null); }
    if (target === "Alumnos") { const name = rows.Alumnos[index]?.[0]; if (name) { const nextCourses = courses.map((course) => ({ ...course, students: course.students.filter((student) => student !== name) })); setCourses(nextCourses); setRows((current) => ({ ...current, Cursos: nextCourses.map(courseToRow) })); } }
    if (target === "Profesores") { const name = rows.Profesores[index]?.[0]; if (name) { const nextCourses = courses.map((course) => ({ ...course, teachers: course.teachers.filter((teacher) => teacher !== name) })); setCourses(nextCourses); setRows((current) => ({ ...current, Cursos: nextCourses.map(courseToRow) })); } }
    setDeleteRecord(null); notify("Registro eliminado");
  }
  function saveGenericEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editRecord) return;
    const { section: target, index, values } = editRecord;
    const oldName = (rows[target as keyof typeof rows] as string[][])[index]?.[0];
    setRows((current) => ({ ...current, [target]: (current[target as keyof typeof current] as string[][]).map((row, rowIndex) => rowIndex === index ? values : row) }));
    if (target === "Alumnos" && oldName && values[0] !== oldName) {
      const nextCourses = courses.map((course) => ({ ...course, students: course.students.map((name) => name === oldName ? values[0] : name) }));
      setCourses(nextCourses); setRows((current) => ({ ...current, Cursos: nextCourses.map(courseToRow) }));
    }
    if (target === "Profesores" && oldName && values[0] !== oldName) {
      const nextCourses = courses.map((course) => ({ ...course, teachers: course.teachers.map((name) => name === oldName ? values[0] : name) }));
      setCourses(nextCourses); setRows((current) => ({ ...current, Cursos: nextCourses.map(courseToRow) }));
    }
    setEditRecord(null); notify("Cambios guardados");
  }
  function changeSection(target: Section) { setSection(target); setSearch(""); setMobileMenu(false); }
  async function logout() { try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.assign("/login"); } }
  function openCreate(target: Section) {
    setSection(target); setSearch(""); setActiveRankingId(null); setFormTitle(""); setFormDetail(""); setMemberBirth(""); setMemberDni(""); setMemberEmail(""); setMemberPhone(""); setTeacherSlots([]); setTeacherLevels([]); setCourseLevel("Intermedio"); setCourseTeachers([]); setCourseStudents([]); setCourseSlots([]); setCoursePrice(""); setCourseStarts(""); setCourseEnds(""); setClassDate(""); setRankingDate(""); setRankingVenue(""); setEditingCourseId(null); setEditingRankingId(null); if (target === "Clases") { const course = courses[0]; setClassCourseId(course?.id || ""); setClassTeacher(course?.teachers[0] || ""); setClassTime(course?.slots[0] || ""); } setDialog(true);
  }

  return <main className="admin-app" style={{ ["--admin-brand" as string]: brandColor } as React.CSSProperties}>
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
                {label === "Pagos" && <i className="nav-notice rail-caption">3</i>}
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
      <header className="admin-topbar"><button className="admin-menu-toggle" aria-label="Abrir menú" onClick={() => setMobileMenu((v) => !v)}><Menu size={20} /></button><div className="admin-breadcrumb"><span>Academia</span><ChevronRight size={14} /><strong>{section}</strong></div><div className="admin-top-actions"><label className="admin-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar alumnos, clases..." /></label><button className="admin-icon-button" aria-label="Notificaciones" onClick={() => notify("No tienes notificaciones nuevas")}><Bell size={18} /><i /></button><div className="admin-profile"><span>AM</span><strong>Andrea Medina</strong></div><button className="admin-logout-top" onClick={() => void logout()} title="Cerrar sesión"><LogOut size={16}/><span>Cerrar sesión</span></button></div></header>
      <div className="admin-workspace">
        {section === "Resumen" ? <>
          <div className="admin-page-heading"><div><span className="admin-eyebrow">LUNES, 17 DE NOVIEMBRE DE 2026</span><h1>Centro de gestión</h1><p>Una vista clara de la actividad de tu academia.</p></div><button className="admin-primary-button" onClick={() => openCreate("Clases")}><Plus size={17} /> Programar clase</button></div>
          <div className="admin-filterbar"><div className="admin-live"><i /> Datos de demostración</div><button onClick={() => setDateRange(dateRange === "Últimos 30 días" ? "Esta semana" : "Últimos 30 días")}><CalendarDays size={15} />{dateRange}<ChevronDown size={14} /></button><button onClick={() => notify("Exportación de ejemplo lista")}><ArrowUpRight size={15} /> Exportar</button></div>
          <div className="admin-stats-grid">
            <StatCard icon={Users} label="Alumnos activos" value="248" delta="+12 este mes" tone="blue" data={[24,32,27,38,34,44,41,55,49,62,58,72]} />
            <StatCard icon={CircleDollarSign} label="Ingresos del mes" value="S/. 18,640" delta="+8.4% vs. mes anterior" tone="green" data={[40,36,48,45,52,50,64,60,72,68,86,92]} />
            <StatCard icon={CalendarDays} label="Clases programadas" value="36" delta="6 hoy" tone="purple" data={[26,40,38,52,44,64,55,70,66,73,68,86]} />
            <StatCard icon={Trophy} label="Rankings activos" value="3" delta="25 cupos disponibles" tone="orange" data={[22,28,38,30,50,42,58,51,67,63,74,82]} />
          </div>
          <div className="admin-dashboard-grid"><section className="admin-panel-card admin-chart-panel"><div className="admin-card-heading"><div><h2>Actividad de la academia</h2><p>Alumnos, asistencia e inscripciones</p></div><button className="admin-more-button" aria-label="Más opciones" onClick={() => notify("Opciones del gráfico") }><MoreHorizontal size={20} /></button></div><div className="chart-legend"><span><i className="legend-blue" />Alumnos activos</span><span><i className="legend-green" />Asistencia</span><span className="chart-range">Por semana</span></div><div className="admin-chart"><div className="chart-y-labels"><span>300</span><span>200</span><span>100</span><span>0</span></div><div className="chart-plot"><div className="chart-gridlines"><i /><i /><i /><i /></div><svg viewBox="0 0 700 200" preserveAspectRatio="none" aria-label="Tendencia de actividad"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3977ed" stopOpacity=".18"/><stop offset="1" stopColor="#3977ed" stopOpacity="0"/></linearGradient></defs><path d="M0 151 C45 137 53 125 95 131 S152 116 190 124 S250 92 286 101 S338 81 380 95 S430 64 477 75 S532 53 571 63 S633 30 700 42 L700 200 L0 200Z" fill="url(#chartFill)"/><path d="M0 151 C45 137 53 125 95 131 S152 116 190 124 S250 92 286 101 S338 81 380 95 S430 64 477 75 S532 53 571 63 S633 30 700 42" fill="none" stroke="#2364dc" strokeWidth="3" vectorEffect="non-scaling-stroke"/><path d="M0 175 C46 160 63 165 95 154 S154 147 190 152 S247 135 286 141 S341 121 380 130 S430 113 477 121 S529 103 571 111 S644 81 700 91" fill="none" stroke="#27a67b" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/></svg><div className="chart-x-labels"><span>20 oct</span><span>27 oct</span><span>03 nov</span><span>10 nov</span><span>17 nov</span></div></div></div><div className="chart-footnote"><span><b>248</b> alumnos activos</span><span><b>91%</b> asistencia promedio</span><button onClick={() => changeSection("Alumnos")}>Ver reporte <ChevronRight size={15} /></button></div></section>
            <section className="admin-panel-card admin-agenda-panel"><div className="admin-card-heading"><div><h2>Agenda de hoy</h2><p>Miércoles, 18 de noviembre</p></div><button className="admin-icon-button" onClick={() => changeSection("Cursos")} aria-label="Ver cursos"><CalendarDays size={17} /></button></div><div className="agenda-summary"><strong>6 clases</strong><span>·</span><span>32 alumnos</span><span className="agenda-live"><i /> En curso</span></div><div className="agenda-list">{[{ time: "4:30", ampm: "PM", color: "soft-blue", title: "Fundamentos de juego", level: "Básico · Mesa 01", teacher: "Raúl Peña", status: "Finalizada" }, { time: "6:00", ampm: "PM", color: "soft-purple", title: "Control de saques & Topspin", level: "Intermedio · Mesa 04", teacher: "Carlos Mendoza", status: "En 20 min" }, { time: "7:30", ampm: "PM", color: "soft-green", title: "Técnica avanzada", level: "Avanzado · Mesa 02", teacher: "Lucía Salazar", status: "Próxima" }].map((item) => <article className="agenda-item" key={item.time}><div className="agenda-time">{item.time}<small>{item.ampm}</small></div><div className={`agenda-marker ${item.color}`} /><div className="agenda-details"><strong>{item.title}</strong><span>{item.level}</span><small><UserRound size={12} />{item.teacher}</small></div><span className={`agenda-status ${item.status === "En 20 min" ? "upcoming" : ""}`}>{item.status}</span></article>)}</div><button className="admin-plain-link" onClick={() => changeSection("Clases")}>Ver agenda completa <ChevronRight size={15} /></button></section>
            <section className="admin-panel-card admin-activity-panel"><div className="admin-card-heading"><div><h2>Actividad reciente</h2><p>Actualizaciones de tu academia</p></div><button className="admin-plain-link" onClick={() => changeSection("Avisos")}>Ver todo <ChevronRight size={15} /></button></div><div className="activity-list"><ActivityItem icon={Users} title="Nueva matrícula" detail="Valeria Rojas · Plan competitivo" time="Hace 8 min" tone="blue" /><ActivityItem icon={CreditCard} title="Pago recibido" detail="Mateo Gonzales · S/. 280.00" time="Hace 24 min" tone="green" /><ActivityItem icon={Trophy} title="Nuevo ranking publicado" detail="Torneo Relámpago #14 · 16 inscritos" time="Hace 1 h" tone="orange" /></div></section>
            <section className="admin-panel-card admin-quick-panel"><div className="admin-card-heading"><div><h2>Accesos rápidos</h2><p>Las tareas frecuentes, a un clic</p></div></div><div className="quick-actions"><QuickAction icon={UserRound} title="Agregar alumno" detail="Registrar matrícula" onClick={() => openCreate("Alumnos")} /><QuickAction icon={GraduationCap} title="Agregar profesor" detail="Crear disponibilidad" onClick={() => openCreate("Profesores")} /><QuickAction icon={CalendarDays} title="Crear curso" detail="Definir grupo y horarios" onClick={() => openCreate("Cursos")} /><QuickAction icon={ClipboardList} title="Programar clase" detail="Dentro de un curso" onClick={() => openCreate("Clases")} /></div></section></div>
        </> : section === "Rankings" && activeRankingId ? (() => {
          const ranking = rankings.find((item) => item.id === activeRankingId);
          if (!ranking) return <div className="admin-empty-state"><button className="admin-plain-link" onClick={() => setActiveRankingId(null)}>Volver a rankings</button></div>;
          return <RankingManager ranking={ranking} academyStudents={rows.Alumnos.map((row) => ({ name: row[0], dni: row[1] }))} onBack={() => setActiveRankingId(null)} onToast={notify} onChange={(updated) => { const index = rankings.findIndex((item) => item.id === updated.id); setRankings((current) => current.map((item) => item.id === updated.id ? updated : item)); setRows((current) => ({ ...current, Rankings: current.Rankings.map((row, rowIndex) => rowIndex === index ? rankingToRow(updated) : row) })); }} />;
        })() : section === "Mi academia" ? <>
          <div className="admin-page-heading"><div><span className="admin-eyebrow">PERSONALIZACIÓN</span><h1>Mi academia</h1><p>Configura la identidad que verán tus alumnos en el subdominio.</p></div><div className="tenant-domain"><ShieldCheck size={16} /> lawntennis.ttacademias.com</div></div><div className="settings-layout"><section className="admin-panel-card academy-settings-card"><div className="admin-card-heading"><div><h2>Marca y portal</h2><p>Estos datos personalizan el portal de estudiantes.</p></div></div><label className="admin-form-label">Nombre de la academia<input value={academyName} onChange={(e) => setAcademyName(e.target.value)} /></label><label className="admin-form-label">URL del logo<input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://.../logo.png" /></label><label className="admin-form-label">Color principal<div className="color-picker-row"><input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} /><input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} /></div></label><button className="admin-primary-button" onClick={() => void saveAcademySettings()}><CheckCircle2 size={16} /> Guardar cambios</button><p className="admin-form-hint">El logo y el color se guardan y se aplican al subdominio de esta academia.</p></section><section className="admin-panel-card portal-preview-card"><div className="admin-card-heading"><div><h2>Vista previa del estudiante</h2><p>Ejemplo del encabezado de tu portal</p></div></div><div className="portal-preview" style={{ ["--preview-brand" as string]: brandColor } as React.CSSProperties}><div className="preview-header"><span>{logoUrl ? <img src={logoUrl} alt="" /> : <Activity size={18} />}</span><strong>{academyName}</strong></div><div className="preview-welcome"><small>MIÉRCOLES, 18 NOV</small><h3>Hola, Mateo</h3><p>Sede Miraflores</p></div><div className="preview-class"><span>CLASE DE HOY</span><strong>Control de Saques &amp; Topspin</strong><button>Confirmar asistencia</button></div></div></section></div>
        </> : <>
          <div className="admin-page-heading"><div><h1>{section}</h1><p>{sectionDescription(section)}</p></div>{actionLabel[section] && <button className="admin-primary-button" onClick={() => openCreate(section)}><Plus size={17} />{actionLabel[section]}</button>}</div>
          <div className="admin-panel-card admin-table-card"><div className="admin-list-toolbar"><label className="admin-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Buscar en ${section.toLowerCase()}...`} /></label><button onClick={() => notify("Filtros disponibles próximamente")}><SlidersHorizontal size={16} /> Filtros</button><span>{filteredRows.length} registros</span></div>
          <div className="admin-table-wrap"><table><thead><tr>{(section === "Alumnos" ? ["ALUMNO", "EDAD", "NIVEL", "CORREO", "CELULAR", "MATRÍCULA"] : section === "Profesores" ? ["PROFESOR", "FECHA NACIMIENTO", "NIVELES QUE ENSEÑA", "CORREO", "CELULAR", "BLOQUES DISPONIBLES"] : section === "Cursos" ? ["CURSO", "NIVEL · HORARIO", "ALUMNOS MATRICULADOS", "PROFESORES", "VIGENCIA", "COSTO TOTAL"] : section === "Clases" ? ["CLASE / SESIÓN", "CURSO", "FECHA Y HORA", "PROFESOR", "ALUMNOS"] : section === "Rankings" ? ["RANKING", "FECHA", "CUPOS", "ESTADO"] : section === "Pagos" ? ["ALUMNO", "CONCEPTO", "MONTO", "ESTADO"] : ["AVISO", "FECHA", "DESTINATARIOS", "ESTADO"]).map((head) => <th scope="col" key={head}>{head.charAt(0) + head.slice(1).toLocaleLowerCase("es-PE")}</th>)}<th /></tr></thead><tbody>{filteredRows.map((row, index) => {
            const sourceIndex = (rows[section as keyof typeof rows] as string[][]).indexOf(row);
            const cells = section === "Alumnos" ? [row[0], String(calculateAge(row[2])), row[3], row[4], row[5], row[6]] : section === "Cursos" ? [row[0], `${row[1]} · ${row[6]}`, row[2], row[3], row[4], row[5]] : row;
            return <tr key={`${row[0]}-${index}`} className={section === "Cursos" ? "course-list-row" : ""}>{cells.map((cell, cellIndex) => <td key={cellIndex}>{cellIndex === 0 && section === "Cursos" ? <button className="course-title-link" onClick={() => setCourseStudentsView(courses[sourceIndex] || null)}>{cell}<ChevronRight size={14}/></button> : cellIndex === 0 ? <strong>{cell}</strong> : section === "Alumnos" && cellIndex === 5 ? <button className="enrollment-view-button" onClick={() => setStudentDetails(row)}>Ver matrícula <ChevronRight size={13}/></button> : section === "Cursos" && cellIndex === 2 ? <button className="course-participants-button" onClick={() => setCourseStudentsView(courses[sourceIndex] || null)}>{cell} <ChevronRight size={13}/></button> : section === "Alumnos" && cellIndex === 1 ? <span className="age-value">{cell} años</span> : cellIndex === row.length - 1 && !["Alumnos", "Profesores", "Cursos", "Clases"].includes(section) ? <span className={`table-status ${cell.toLowerCase().includes("pendiente") || cell.toLowerCase().includes("renovar") ? "warning" : ""}`}><i />{cell}</span> : cell}</td>)}<td><div className="admin-row-actions">{section === "Cursos" && <button className="row-action" title="Ver o editar horario" aria-label={`Horario de ${row[0]}`} onClick={() => openCourseSchedule(courses[sourceIndex] || null)}><CalendarClock size={15} /></button>}{section === "Rankings" && <button className="row-action manage" title="Gestionar ranking" aria-label={`Gestionar ${row[0]}`} onClick={() => setActiveRankingId(rankings[sourceIndex]?.id || null)}><Users size={15} /></button>}<button className="row-action" title="Editar" aria-label={`Editar ${row[0]}`} onClick={() => openEditRecord(section, row)}><Pencil size={14} /></button><button className="row-action delete" title="Eliminar" aria-label={`Eliminar ${row[0]}`} onClick={() => setDeleteRecord({ section, index: sourceIndex, name: row[0] })}><Trash2 size={14} /></button></div></td></tr>;
          })}</tbody></table>{filteredRows.length === 0 && <div className="admin-empty-state">No encontramos resultados con esa búsqueda.</div>}</div></div>
        </>}
      </div>
    </section>
    {dialog && !scheduleEditor && <Modal className={`admin-form-modal ${section === "Profesores" ? "teacher-modal" : section === "Cursos" ? "course-modal" : section === "Clases" ? "class-modal" : ""}`} labelledBy="admin-create-title" notice={toast} onDismiss={() => setDialog(false)}>
      <div className="admin-modal-heading"><div><span className="admin-eyebrow">{section.toUpperCase()}</span><h2 id="admin-create-title">{section === "Cursos" && editingCourseId ? "Editar curso" : section === "Rankings" && editingRankingId ? "Editar ranking" : actionLabel[section] || "Nuevo registro"}</h2><p>{section === "Alumnos" ? "Ingresa los datos del estudiante y asígnale su nivel." : section === "Profesores" ? "Registra sus datos y marca sus bloques disponibles." : section === "Cursos" ? "Configura el programa completo de enseñanza: grupo, costo, fechas y horario." : section === "Clases" ? "Añade una sesión a uno de los cursos asociados al profesor." : section === "Rankings" ? "Define fecha, sede, aforo y tarifas para alumnos y público general." : "Completa los datos principales para continuar."}</p></div><button className="admin-icon-button" aria-label="Cerrar" onClick={() => { setDialog(false); setEditingCourseId(null); setEditingRankingId(null); }}><X size={18} /></button></div>
      <form onSubmit={saveRow}>
        {(section === "Alumnos" || section === "Profesores") && <>
          <label className="admin-form-label">Nombre y apellido<input autoFocus required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={section === "Alumnos" ? "Ej. Mateo Gonzales" : "Ej. Carlos Mendoza"} /></label>
          {section === "Alumnos" && <label className="admin-form-label">DNI<input required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" value={memberDni} onChange={(e) => setMemberDni(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="8 dígitos" /></label>}
          <div className="admin-form-grid"><label className="admin-form-label">Fecha de nacimiento<input type="date" required value={memberBirth} onChange={(e) => setMemberBirth(e.target.value)} /></label><label className="admin-form-label">Celular<input type="tel" required value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} placeholder="+51 987 654 321" /></label></div>
          <label className="admin-form-label">Correo electrónico<input type="email" required value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="nombre@correo.com" /></label>
          {section === "Alumnos" ? <label className="admin-form-label">Nivel<select value={memberLevel} onChange={(e) => setMemberLevel(e.target.value)}><option>Básico</option><option>Intermedio</option><option>Avanzado</option></select></label> : <>
            <MultiSelect label="Niveles que enseña" placeholder="Selecciona los niveles" options={["Básico", "Intermedio", "Avanzado"]} selected={teacherLevels} onChange={setTeacherLevels} emptyLabel="Elige al menos un nivel." required />
            <div className="teacher-calendar-wrap"><div className="teacher-calendar-heading"><div><strong>Disponibilidad semanal</strong><span>Selecciona bloques de dos horas por día</span></div><button type="button" className="calendar-week-control" onClick={() => notify("Semana del 17 al 23 de noviembre")}>Semana del 17 nov <ChevronDown size={14} /></button></div><div className="teacher-calendar-scroll"><div className="teacher-calendar"><div className="teacher-calendar-corner">HORA</div>{teacherCalendarDays.map((day) => <div className="teacher-calendar-day" key={day.day}><strong>{day.day}</strong><small>{day.date}</small></div>)}{twoHourBlocks.map((block) => <div className="teacher-calendar-row" key={block}><div className="teacher-calendar-time">{block}<small>2 horas</small></div>{teacherCalendarDays.map((day) => { const key = `${day.day} ${day.date} · ${block}`; const selected = teacherSlots.includes(key); return <button type="button" aria-label={`${key}, ${selected ? "seleccionado" : "disponible"}`} aria-pressed={selected} className={`teacher-slot ${selected ? "selected" : ""}`} key={key} onClick={() => setTeacherSlots((current) => selected ? current.filter((slot) => slot !== key) : [...current, key])}>{selected && <CheckCircle2 size={15} />}</button>; })}</div>)}</div></div><div className="teacher-calendar-footer"><span>{teacherSlots.length} bloques seleccionados</span><strong>{teacherSlots.length * 2} h disponibles</strong></div></div>
          </>}
        </>}
        {section === "Cursos" && <>
          <label className="admin-form-label">Nombre del curso<input autoFocus required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ej. Fundamentos del tenis de mesa" /></label>
          <div className="admin-form-grid"><label className="admin-form-label">Nivel del curso<select value={courseLevel} onChange={(e) => setCourseLevel(e.target.value)}><option>Básico</option><option>Intermedio</option><option>Avanzado</option></select></label><label className="admin-form-label">Costo total del curso<div className="admin-money-input"><span>S/.</span><input type="number" min="0" step="0.01" required value={coursePrice} onChange={(e) => setCoursePrice(e.target.value)} placeholder="280.00" /></div></label></div>
          <div className="admin-form-grid"><label className="admin-form-label">Fecha de inicio<input type="date" required value={courseStarts} onChange={(e) => setCourseStarts(e.target.value)} /></label><label className="admin-form-label">Fecha de fin<input type="date" min={courseStarts || undefined} required value={courseEnds} onChange={(e) => setCourseEnds(e.target.value)} /></label></div>
          <MultiSelect label="Profesores asociados" placeholder="Elige uno o más profesores" options={rows.Profesores.map((row) => row[0])} selected={courseTeachers} onChange={setCourseTeachers} emptyLabel="Primero agrega profesores a la academia." required />
          <MultiSelect label="Participantes del curso" placeholder="Busca y selecciona alumnos" options={rows.Alumnos.map((row) => row[0])} selected={courseStudents} onChange={setCourseStudents} emptyLabel="Primero agrega alumnos a la academia." required />
          <div className="course-schedule-card"><div><span className="course-schedule-icon"><CalendarDays size={18} /></span><div><strong>Horario semanal</strong><small>{courseSlots.length ? `${courseSlots.length} bloques · ${courseSlots.length * 2} horas por semana` : "Aún no has configurado días y horas"}</small></div></div><button type="button" className="admin-secondary-button" onClick={() => openCourseSchedule(null)}><CalendarClock size={16} /> Ver y editar horario</button></div>
        </>}
        {section === "Clases" && <>
          <label className="admin-form-label">Nombre de la clase o sesión<input autoFocus required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ej. Sesión 1 · Control de saque" /></label>
          <label className="admin-form-label">Curso asociado<select required value={classCourseId} onChange={(e) => { const course = courses.find((item) => item.id === e.target.value); setClassCourseId(e.target.value); setClassTeacher(course?.teachers[0] || ""); setClassDate(""); setClassTime(course?.slots[0] || ""); }}><option value="" disabled>Selecciona un curso</option>{courses.map((course) => <option value={course.id} key={course.id}>{course.name} · {course.level}</option>)}</select></label>
          {(() => { const course = courses.find((item) => item.id === classCourseId); const teachers = course?.teachers || []; const dates = course ? getCourseAvailableDates(course) : []; const availableDate = dates.includes(classDate) ? classDate : ""; const slots = course && availableDate ? getCourseSlotsForDate(course, availableDate) : []; const activeSlot = slots.includes(classTime) ? classTime : slots[0] || ""; return <><div className="admin-form-grid"><label className="admin-form-label">Profesor asociado<select required value={classTeacher} onChange={(e) => setClassTeacher(e.target.value)}>{teachers.map((teacher) => <option key={teacher}>{teacher}</option>)}</select></label><label className="admin-form-label">Fecha disponible<select required value={availableDate} onChange={(e) => { setClassDate(e.target.value); const nextSlots = course ? getCourseSlotsForDate(course, e.target.value) : []; setClassTime(nextSlots[0] || ""); }}><option value="">Selecciona una fecha programada</option>{dates.map((date) => <option key={date} value={date}>{formatLongDate(date)}</option>)}</select></label></div><label className="admin-form-label">Horario disponible<select required disabled={!availableDate} value={activeSlot} onChange={(e) => setClassTime(e.target.value)}>{slots.map((slot) => <option key={slot}>{slot}</option>)}</select></label>{course && !dates.length && <p className="class-schedule-empty">Este curso no tiene fechas futuras disponibles dentro de su vigencia.</p>}<div className="course-assignment-note"><Users size={16} /><span>Participantes vinculados al curso</span><strong>{course?.students.length || 0} alumnos</strong></div><p className="admin-form-hint">Solo puedes elegir fechas y horarios ya configurados en el curso.</p></>; })()}
        </>}
        {section === "Rankings" && <>
          <label className="admin-form-label">Nombre del ranking<input autoFocus required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ej. Torneo Relámpago Apertura" /></label>
          <div className="admin-form-grid"><label className="admin-form-label">Fecha<input type="date" required min={new Date().toISOString().slice(0, 10)} value={rankingDate} onChange={(e) => setRankingDate(e.target.value)} /></label><label className="admin-form-label">Hora<select value={rankingTime} onChange={(e) => setRankingTime(e.target.value)}>{["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "6:00 PM", "7:00 PM"].map((time) => <option key={time}>{time}</option>)}</select></label></div>
          <label className="admin-form-label">Lugar<input required value={rankingVenue} onChange={(e) => setRankingVenue(e.target.value)} placeholder="Dirección o sede del torneo" /></label>
          <div className="admin-form-grid"><label className="admin-form-label">Precio para alumnos<div className="admin-money-input"><span>S/.</span><input type="number" min="0" step="0.50" required value={rankingStudentPrice} onChange={(e) => setRankingStudentPrice(e.target.value)} placeholder="25.00" /></div></label><label className="admin-form-label">Precio para externos<div className="admin-money-input"><span>S/.</span><input type="number" min="0" step="0.50" required value={rankingPublicPrice} onChange={(e) => setRankingPublicPrice(e.target.value)} placeholder="40.00" /></div></label></div>
          <label className="admin-form-label">Aforo máximo<input type="number" min="2" max="200" required value={rankingCapacity} onChange={(e) => setRankingCapacity(e.target.value)} /></label>
          <div className="ranking-link-preview"><Link2 size={16} /><span>Al guardar se generará un enlace público de inscripción.</span></div>
        </>}
        {!( ["Alumnos", "Profesores", "Cursos", "Clases", "Rankings"] as Section[]).includes(section) && <><label className="admin-form-label">Nombre o título<input autoFocus required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={section === "Avisos" ? "Ej. Cambio de horario" : "Escribe un nombre"} /></label><label className="admin-form-label">Detalle<input value={formDetail} onChange={(e) => setFormDetail(e.target.value)} placeholder="Nivel, fecha, horario o información" /></label></>}
        <div className="admin-modal-actions"><button type="button" className="admin-secondary-button" onClick={() => { setDialog(false); setEditingCourseId(null); setEditingRankingId(null); }}>Cancelar</button><button type="submit" className="admin-primary-button"><Plus size={16} />{section === "Cursos" ? editingCourseId ? "Guardar cambios" : "Crear curso" : section === "Clases" ? "Crear clase" : section === "Rankings" ? editingRankingId ? "Guardar cambios" : "Crear ranking" : "Guardar"}</button></div>
      </form></Modal>}
    {scheduleEditor && <Modal className="admin-form-modal course-modal schedule-editor-modal" labelledBy="schedule-editor-title" notice={toast} onDismiss={() => setScheduleEditor(null)}><div className="admin-modal-heading"><div><span className="admin-eyebrow">HORARIO SEMANAL</span><h2 id="schedule-editor-title">{scheduleEditor.step === "edit" ? "Ver y editar horario" : "Confirma el horario"}</h2><p>{scheduleEditor.step === "edit" ? "Marca bloques de dos horas. Revisa los cambios antes de aplicarlos." : "Verifica los días y horas que quedarán guardados en el curso."}</p></div><button className="admin-icon-button" aria-label="Cerrar" onClick={() => setScheduleEditor(null)}><X size={18} /></button></div>{scheduleEditor.step === "edit" ? <><div className="course-calendar-scroll"><div className="course-calendar"><div className="course-calendar-corner">INICIO</div>{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => <div className="course-weekday" key={day}>{day}</div>)}{twoHourBlocks.map((time) => <div className="course-calendar-row" key={time}><div className="course-time-label">{time}<small>2 horas</small></div>{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => { const key = `${day} · ${time}`; const selected = scheduleEditor.draft.includes(key); return <button key={key} type="button" aria-label={`${day}, ${time}`} aria-pressed={selected} className={`course-slot ${selected ? "selected" : ""}`} onClick={() => setScheduleEditor((current) => current ? { ...current, draft: selected ? current.draft.filter((slot) => slot !== key) : [...current.draft, key] } : current)}>{selected ? <CheckCircle2 size={14} /> : <Plus size={12} />}</button>; })}</div>)}</div></div><div className="teacher-calendar-footer"><span>{scheduleEditor.draft.length} bloques seleccionados</span><strong>{scheduleEditor.draft.length * 2} h / semana</strong></div><div className="admin-modal-actions"><button className="admin-secondary-button" onClick={() => setScheduleEditor(null)}>Cancelar</button><button className="admin-primary-button" onClick={confirmCourseSchedule}>Revisar cambios <ChevronRight size={16} /></button></div></> : <><div className="schedule-doublecheck"><span><CheckCircle2 size={20} /></span><div><strong>{scheduleEditor.draft.length} bloques · {scheduleEditor.draft.length * 2} horas semanales</strong><p>{scheduleEditor.draft.join(" · ")}</p></div></div><p className="admin-form-hint">Al confirmar, estas franjas definirán las fechas y horas disponibles para programar clases. Puedes volver a editarlas después.</p><div className="admin-modal-actions"><button className="admin-secondary-button" onClick={() => setScheduleEditor({ ...scheduleEditor, step: "edit" })}>Volver a editar</button><button className="admin-primary-button" onClick={confirmCourseSchedule}><Check size={16} />Confirmar horario</button></div></>}</Modal>}
    {editRecord && <Modal className="admin-form-modal generic-edit-modal" label="Editar registro" notice={toast} onDismiss={() => setEditRecord(null)}><div className="admin-modal-heading"><div><span className="admin-eyebrow">{editRecord.section.toUpperCase()}</span><h2>Editar registro</h2><p>Actualiza los datos y guarda los cambios.</p></div><button className="admin-icon-button" aria-label="Cerrar" onClick={() => setEditRecord(null)}><X size={18} /></button></div><form onSubmit={saveGenericEdit}>{editRecord.values.map((value, index) => <label className="admin-form-label" key={index}>{getColumnLabels(editRecord.section, editRecord.values)[index] || `Dato ${index + 1}`}<input value={value} onChange={(e) => setEditRecord((current) => current ? { ...current, values: current.values.map((item, itemIndex) => itemIndex === index ? e.target.value : item) } : current)} /></label>)}<div className="admin-modal-actions"><button type="button" className="admin-secondary-button" onClick={() => setEditRecord(null)}>Cancelar</button><button className="admin-primary-button" type="submit"><Check size={16} />Guardar cambios</button></div></form></Modal>}
    {studentDetails && <Modal className="admin-form-modal enrollment-details-modal" labelledBy="student-enrollment-title" notice={toast} onDismiss={() => setStudentDetails(null)}><div className="admin-modal-heading"><div><span className="admin-eyebrow">DETALLE DE MATRÍCULA</span><h2 id="student-enrollment-title">{studentDetails[0]}</h2><p>DNI {studentDetails[1]} · {calculateAge(studentDetails[2])} años · Nivel {studentDetails[3]}</p></div><button className="admin-icon-button" aria-label="Cerrar" onClick={() => setStudentDetails(null)}><X size={18}/></button></div>{courses.filter((course) => course.students.includes(studentDetails[0])).length ? <div className="enrollment-course-list">{courses.filter((course) => course.students.includes(studentDetails[0])).map((course) => <article className="enrollment-course-card" key={course.id}><div className="enrollment-course-heading"><div><span>CURSO MATRICULADO</span><h3>{course.name}</h3></div><b>{course.level}</b></div><div className="enrollment-course-meta"><div><small>Vigencia hasta</small><strong>{formatLongDate(course.ends)}</strong></div><div><small>Pago del curso</small><strong>{studentDetails[6]?.toLowerCase().includes("renovar") ? "Pendiente" : "Al día"}</strong></div><div><small>Costo del curso</small><strong>S/. {Number(course.price).toFixed(2)}</strong></div></div><p className="enrollment-course-schedule">Horario: {course.slots.join(" · ")}</p></article>)}</div> : <div className="course-students-empty">Este alumno aún no está matriculado en un curso.</div>}<div className="admin-modal-actions"><button className="admin-primary-button" onClick={() => setStudentDetails(null)}>Listo</button></div></Modal>}
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
function RankingManager({ ranking, academyStudents, onBack, onToast, onChange }: { ranking: Ranking; academyStudents: AcademyStudent[]; onBack: () => void; onToast: (message: string) => void; onChange: (ranking: Ranking) => void }) {
  const [manualDni, setManualDni] = useState("");
  const [manualName, setManualName] = useState("");
  const [copyDone, setCopyDone] = useState(false);
  const paidCount = ranking.participants.filter((item) => item.paid).length;
  const publicLink = typeof window === "undefined" ? `/ranking/${ranking.id}` : `${window.location.origin}/ranking/${ranking.id}`;
  const matchedStudent = academyStudents.find((student) => student.dni === manualDni);
  const manualValidDni = /^\d{8}$/.test(manualDni);
  function updateParticipant(id: string, changes: Partial<RankingParticipant>) {
    onChange({ ...ranking, participants: ranking.participants.map((item) => item.id === id ? { ...item, ...changes } : item) });
  }
  function addParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ranking.participants.length >= ranking.capacity) { onToast("El ranking alcanzó el aforo máximo"); return; }
    if (!manualValidDni) { onToast("Ingresa un DNI válido de 8 dígitos"); return; }
    const cleanName = (matchedStudent?.name || manualName).trim();
    if (!cleanName) { onToast("Ingresa el nombre del participante externo"); return; }
    if (ranking.participants.some((item) => item.dni === manualDni || item.name.toLowerCase() === cleanName.toLowerCase())) { onToast("Este participante ya está inscrito o pendiente"); return; }
    const participant: RankingParticipant = { id: `participant-${Date.now()}`, name: cleanName, dni: manualDni, kind: matchedStudent ? "Alumno" : "Externo", paid: false, weight: 5 };
    onChange({ ...ranking, participants: [...ranking.participants, participant] });
    setManualDni(""); setManualName("");
    onToast(`Enlace de pago generado · tarifa ${participant.kind === "Alumno" ? "de academia" : "externa"}`);
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(publicLink); setCopyDone(true); window.setTimeout(() => setCopyDone(false), 1800); onToast("Enlace copiado"); }
    catch { onToast("Copia este enlace desde el campo de inscripción"); }
  }
  function generateGroups() {
    const sorted = ranking.participants.filter((item) => item.paid).sort((a, b) => a.weight - b.weight || a.name.localeCompare(b.name, "es"));
    if (!sorted.length) { onToast("Registra al menos un pago antes de generar grupos"); return; }
    const next: RankingParticipant[] = ranking.participants.map((item) => ({ ...item, group: undefined }));
    const groupCount = Math.ceil(sorted.length / 5);
    sorted.forEach((participant, index) => {
      const round = Math.floor(index / groupCount);
      const offset = index % groupCount;
      const group = round % 2 === 0 ? offset + 1 : groupCount - offset;
      const entry = next.find((item) => item.id === participant.id);
      if (entry) entry.group = group;
    });
    onChange({ ...ranking, participants: next });
    onToast(`${Math.ceil(sorted.length / 5)} grupo(s) generado(s), máximo 5 participantes por grupo`);
  }
  const groups = Array.from(new Set(ranking.participants.filter((item) => item.paid && item.group).map((item) => item.group as number))).sort((a, b) => a - b);
  return <div className="ranking-admin-view">
    <button className="back-link ranking-back" onClick={onBack}><ChevronRight className="back-chevron" size={16} /> Volver a rankings</button>
    <div className="admin-page-heading"><div><span className="admin-eyebrow">GESTIÓN DE COMPETENCIA</span><h1>{ranking.title}</h1><p>{formatLongDate(ranking.date)} · {ranking.time} · {ranking.venue}</p>{ranking.id === "ranking-14" && <span className="demo-rank-badge">DATOS DE PRUEBA · 20 PARTICIPANTES</span>}</div><button className="admin-secondary-button" onClick={copyLink}><Copy size={15} />{copyDone ? "Copiado" : "Copiar enlace"}</button></div>
    <div className="ranking-admin-stats"><div><span>Inscritos</span><strong>{ranking.participants.length} <small>/ {ranking.capacity}</small></strong></div><div><span>Pagos confirmados</span><strong>{paidCount}</strong></div><div><span>Tarifa alumno</span><strong>S/. {ranking.studentPrice.toFixed(2)}</strong></div><div><span>Tarifa externo</span><strong>S/. {ranking.publicPrice.toFixed(2)}</strong></div></div>
    <section className="admin-panel-card ranking-share-card"><div className="ranking-share-icon"><Link2 size={18} /></div><div><strong>Enlace público de inscripción</strong><p>Alumnos y externos completan su inscripción desde esta página. El cupo se confirma después del pago.</p><code>{publicLink}</code></div><a href={publicLink} target="_blank" rel="noreferrer" className="row-action" aria-label="Abrir enlace"><ExternalLink size={16} /></a></section>
    <div className="ranking-admin-layout"><section className="admin-panel-card ranking-participants-card"><div className="admin-card-heading"><div><h2>Participantes</h2><p>Separa alumnos y externos; asigna peso del 1 al 5 para sembrar grupos.</p></div><span className="course-selected-count">{ranking.participants.length} / {ranking.capacity}</span></div>
      <form className="ranking-add-participant" onSubmit={addParticipant}><label className="admin-form-label">DNI<input required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" value={manualDni} onChange={(e) => { setManualDni(e.target.value.replace(/\D/g, "").slice(0, 8)); setManualName(""); }} placeholder="8 dígitos" /></label>{manualValidDni && (matchedStudent ? <div className="ranking-dni-match"><CheckCircle2 size={15} /><span><strong>{matchedStudent.name}</strong><small>Alumno de la academia</small></span></div> : <label className="admin-form-label">Nombre del externo<input required value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Nombre y apellido" /></label>)}<div className="ranking-price-preview"><span>{matchedStudent ? "Tarifa alumno" : manualValidDni ? "Tarifa externo" : "Tarifa"}</span><strong>S/. {(matchedStudent ? ranking.studentPrice : ranking.publicPrice).toFixed(2)}</strong></div><button className="admin-primary-button" type="submit" disabled={ranking.participants.length >= ranking.capacity || !manualValidDni || (!matchedStudent && !manualName.trim())}><CirclePlus size={16} />Generar pago</button></form>
      <div className="ranking-participant-table"><div className="ranking-participant-head"><span>PARTICIPANTE</span><span>TIPO / TARIFA</span><span>PESO</span><span>PAGO</span><span>GRUPO</span><span /></div>{ranking.participants.map((person) => <div className="ranking-participant-row" key={person.id}><div><strong>{person.name}</strong><small>{person.dni ? `DNI ${person.dni}` : person.kind}</small></div><div><span>S/. {(person.kind === "Alumno" ? ranking.studentPrice : ranking.publicPrice).toFixed(2)}</span></div><label className="ranking-weight-field"><span className="sr-only">Peso de {person.name}</span><select value={person.weight} onChange={(e) => updateParticipant(person.id, { weight: Number(e.target.value), group: undefined })}>{[1, 2, 3, 4, 5].map((weight) => <option key={weight} value={weight}>{weight}{weight === 1 ? " · mejor" : ""}</option>)}</select></label><span className={`payment-state ${person.paid ? "paid" : "pending"}`}><i />{person.paid ? "Pagado" : "Pendiente"}</span><span className="ranking-group-cell">{person.group ? `Grupo ${person.group}` : "—"}</span>{!person.paid && person.dni && <a className="row-action manage" title="Abrir enlace de pago" href={`${publicLink}?pay=${person.id}`} target="_blank" rel="noreferrer"><Link2 size={14} /></a>}{!person.paid && !person.dni && <button type="button" className="row-action manage" title="Simular pago confirmado" onClick={() => updateParticipant(person.id, { paid: true })}><Check size={14} /></button>}</div>)}</div>
      <p className="ranking-seed-note"><Trophy size={15} /> Peso 1 es el mejor sembrado; peso 5 es el último. Solo participantes con pago confirmado entran en los grupos.</p>
    </section><section className="admin-panel-card ranking-groups-card"><div className="admin-card-heading"><div><h2>Grupos del torneo</h2><p>Máximo 5 jugadores por grupo</p></div><button className="admin-primary-button" onClick={generateGroups}><Users size={15} />Generar grupos</button></div>{groups.length ? <div className="ranking-groups-list">{groups.map((group) => <article className="ranking-group-card" key={group}><div className="ranking-group-title"><strong>Grupo {String.fromCharCode(64 + group)}</strong><span>{ranking.participants.filter((person) => person.group === group).length} / 5 jugadores</span></div>{ranking.participants.filter((person) => person.group === group).sort((a, b) => a.weight - b.weight).map((person, index) => <div className="ranking-group-player" key={person.id}><span>{index + 1}</span><strong>{person.name}</strong><small>{person.kind} · Peso {person.weight}</small></div>)}</article>)}</div> : <div className="ranking-groups-empty"><span><Users size={22} /></span><strong>Aún no hay grupos</strong><p>Registra los pagos, ajusta el peso de cada participante y genera grupos de hasta cinco personas.</p></div>}</section></div>
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
