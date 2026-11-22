import type {Contract,Course} from "./course-finance";

export type Lesson={id:string;projectedId?:string;courseId:string;title:string;startsAt:string;teacher?:string;status?:string};
export type AttendanceMark={lessonId:string;courseId:string;teacher:string;state:"taught"|"missed"|"pending";startsAt:string};
export type Income={id:string;courseId:string|null;student:string;concept:string;cents:number;date:string;source:string;reference?:string|null};
export type LedgerFeed={lessons:Lesson[];income:Income[]};

const days=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
export function slotTime(slot:string) {
  const match=slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if(!match)return null;
  const hour=Number(match[1])%12+(match[3].toUpperCase()==="PM"?12:0);
  return String(hour).padStart(2,"0")+":"+match[2];
}
export function weeklyLessons(course:Course):Lesson[] {
  const byDay=days.map(day=>[...new Set(course.slots.filter(s=>s.startsWith(day+" ")).map(slotTime).filter(Boolean))]);
  const lessons:Lesson[]=[];
  const end=Date.parse(course.ends+"T00:00:00Z");
  for(let day=Date.parse(course.starts+"T00:00:00Z");day<=end;day+=86400000){
    const utc=new Date(day);
    for(const time of byDay[utc.getUTCDay()]){
      const local=utc.toISOString().slice(0,10)+"T"+time;
      lessons.push({id:local,courseId:course.id,title:course.name,startsAt:local+":00-05:00"});
    }
  }
  return lessons;
}
export function courseLessons(course:Course, official:Lesson[], named:Lesson[]) {
  const actual=official.filter(s=>s.courseId===course.id);
  const scheduled=named.filter(s=>s.courseId===course.id);
  if(actual.length) {
    return [...actual.filter(s=>s.status!=="cancelled"),...scheduled.filter(s=>s.status!=="cancelled" && !actual.some(a=>a.id===s.projectedId || Date.parse(a.startsAt)===Date.parse(s.startsAt) && a.teacher===s.teacher))]
      .sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
  }
  const base=weeklyLessons(course);
  const byTime=new Map(base.map(s=>[Date.parse(s.startsAt),s]));
  for(const session of scheduled){
    const key=Date.parse(session.startsAt);
    byTime.set(key,session);
  }
  return [...byTime.values()].filter(s=>s.status!=="cancelled").sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
}
export function teacherPay(course:Course,name:string,contract:Contract|undefined,lessons:Lesson[],marks:AttendanceMark[],now=Date.now()) {
  const assigned=lessons.filter(s=>!s.teacher || s.teacher===name || contract?.role==="De apoyo");
  const amount=contract?.cents||0;
  const entries=assigned.map((s,i)=>{
    const mark=marks.find(m=>m.teacher===name && m.courseId===course.id && m.lessonId===s.id);
    const future=Date.parse(s.startsAt)>now;
    const state=future?"future":mark?.state || (s.status==="completed" && s.teacher===name?"taught":"pending");
    const share=Math.floor(amount/assigned.length)+(i<amount%assigned.length?1:0);
    return {...s,state,share};
  });
  const discount=entries.reduce((sum,s)=>s.state==="missed"?sum+s.share:sum,0);
  return {course,contract,entries,amount,discount,net:amount-discount};
}
export function uniqueIncome(items:Income[]) {
  const seen=new Set<string>();
  return items.filter(item=>{
    const key=JSON.stringify([item.source.toLowerCase(),item.reference||item.id]);
    if(seen.has(key))return false;
    seen.add(key);return true;
  });
}
