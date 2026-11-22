import {getDb} from "./db";
import {validEmail} from "./enrollment-types";
import {EnrollmentError} from "./enrollment";
import {sendInquiryMail} from "./mail";
import type {RowDataPacket} from "mysql2/promise";

type Inquiry = {message:string; createdAt:string; attemptedAt?:string; status:"pending"|"sending"|"sent"};
const key = (id:string) => "inquiry:"+id;
export const validInquiryId = (id:unknown):id is string => typeof id==="string" && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id);

export async function acceptInquiry(academy:string,id:string,message:string) {
  const db=await getDb().getConnection();
  try {
    await db.beginTransaction();
    await db.execute("SELECT id FROM academies WHERE id=? FOR UPDATE",[academy]);
    const [prior]=await db.execute<RowDataPacket[]>("SELECT record_key FROM academy_operations WHERE academy_id=? AND record_key=?",[academy,key(id)]);
    if (!prior.length) {
      const since=new Date(Date.now()-60000).toISOString();
      const [counts]=await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS n FROM academy_operations WHERE academy_id=? AND record_key LIKE 'inquiry:%' AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.createdAt'))>=?",[academy,since]);
      if (counts[0].n>=6) throw new EnrollmentError("Se recibieron varias consultas. Intenta en un minuto.",429);
      const inquiry:Inquiry={message,createdAt:new Date().toISOString(),status:"pending"};
      await db.execute("INSERT INTO academy_operations (academy_id,record_key,revision,payload) VALUES (?,?,1,?)",[academy,key(id),JSON.stringify(inquiry)]);
    }
    await db.commit();
    return prior.length===0;
  } catch(e){await db.rollback();throw e;} finally{db.release();}
}

export async function deliverInquiry(academy:string,id:string) {
  const db=getDb();
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT a.name, o.revision, CAST(o.payload AS CHAR CHARACTER SET utf8mb4) AS payload,
    JSON_UNQUOTE(r.payload) AS recipient FROM academy_operations o JOIN academies a ON a.id=o.academy_id LEFT JOIN academy_operations r ON r.academy_id=a.id AND r.record_key='mail:inquiries'
    WHERE o.academy_id=? AND o.record_key=?`,[academy,key(id)]);
  if (!rows.length) throw new EnrollmentError("Consulta no encontrada.",404);
  const row=rows[0], inquiry=JSON.parse(row.payload) as Inquiry;
  if (inquiry.status==="sent") return true;
  if (!validEmail(row.recipient || "") || (inquiry.status==="sending" && Date.now()-Date.parse(inquiry.attemptedAt || inquiry.createdAt)<300000)) return false;
  const update=async(revision:number,status:Inquiry["status"])=>{
    const [result]=await db.execute<import("mysql2").ResultSetHeader>("UPDATE academy_operations SET revision=revision+1,payload=? WHERE academy_id=? AND record_key=? AND revision=?",[JSON.stringify({...inquiry,status,attemptedAt:new Date().toISOString()}),academy,key(id),revision]);
    return result.affectedRows===1;
  };
  if (!await update(row.revision,"sending")) return false;
  try {await sendInquiryMail(row.recipient,row.name,inquiry.message);}
  catch {await update(row.revision+1,"pending");return false;}
  return update(row.revision+1,"sent");
}

export async function inquiryInbox(academy:string) {
  const [rows]=await getDb().execute<RowDataPacket[]>("SELECT record_key,CAST(payload AS CHAR CHARACTER SET utf8mb4) AS payload FROM academy_operations WHERE academy_id=? AND record_key LIKE 'inquiry:%' ORDER BY JSON_UNQUOTE(JSON_EXTRACT(payload,'$.createdAt')) DESC LIMIT 100",[academy]);
  return rows.filter(r=>r.record_key.startsWith("inquiry:")).map(r=>({id:r.record_key.slice(8),...JSON.parse(r.payload) as Inquiry}));
}
