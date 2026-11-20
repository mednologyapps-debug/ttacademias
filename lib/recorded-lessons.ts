import type {RowDataPacket} from "mysql2";
import {getDb} from "./db";
import type {Lesson} from "./teaching-ledger";

export async function recordedLessons(academy:string):Promise<Lesson[]> {
  if(process.env.NODE_ENV==="development" && academy==="local-enrollment-demo")return [];
  const [sessions]=await getDb().execute<RowDataPacket[]>("SELECT c.id,c.course_id,c.title,c.starts_at,c.status,u.full_name FROM classes c JOIN users u ON u.id=c.teacher_id AND u.academy_id=c.academy_id WHERE c.academy_id=? ORDER BY c.starts_at,c.id",[academy]);
  return sessions.map(r=>({id:r.id,courseId:r.course_id,title:r.title,startsAt:new Date(r.starts_at).toISOString(),teacher:r.full_name,status:r.status}));
}
