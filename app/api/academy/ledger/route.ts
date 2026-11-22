import type {RowDataPacket} from "mysql2";
import {adminAcademy} from "@/lib/enrollment";
import {recordedLessons} from "@/lib/recorded-lessons";
import {getDb} from "@/lib/db";
import type {Tournament} from "@/lib/tournament";
import {records,operationsFailure} from "@/lib/operations-store";
import {uniqueIncome,type LedgerFeed} from "@/lib/teaching-ledger";

export async function GET() {
  try {
    const academy=await adminAcademy();
    const feed:LedgerFeed={lessons:[],income:[]};
    if(!(process.env.NODE_ENV==="development" && academy==="local-enrollment-demo")){
      const db=getDb();
      const [lessons,[payments]]=await Promise.all([
        recordedLessons(academy),
        db.execute<RowDataPacket[]>(`SELECT p.id,p.amount,p.provider,p.provider_reference,p.purpose,p.reference_id,
          DATE_FORMAT(COALESCE(p.paid_at,p.created_at),'%Y-%m-%d') paid_date,u.full_name
          FROM payments p JOIN users u ON u.id=p.student_id AND u.academy_id=p.academy_id
          WHERE p.academy_id=? AND p.status='paid' AND p.currency='PEN' ORDER BY p.paid_at DESC,p.id`,[academy])
      ]);
      feed.lessons=lessons;
      feed.income=uniqueIncome(payments.map(r=>({id:r.id,courseId:r.purpose==="enrollment"?r.reference_id:null,
        student:r.full_name,concept:r.purpose==="enrollment"?"Matrícula":r.purpose==="ranking"?"Ranking":"Membresía",
        cents:Math.round(Number(r.amount)*100),date:r.paid_date,source:r.provider?.toLowerCase()==="izipay"?"Izipay":r.provider||"Registrado",reference:r.provider_reference})));
    }
    const events=await records(academy,true);
    for(const [key,row] of Object.entries(events)){
      if(!key.startsWith("event:"))continue;
      const {event}=row.value as Tournament;
      for(const p of event.participants)if(p.paid && p.receipt?.cents)feed.income.push({
        id:event.id+"-"+p.id,student:p.name,cents:p.receipt.cents,date:p.receipt.date,courseId:null,source:"Manual",concept:event.title
      });
    }
    return Response.json(feed,{headers:{"Cache-Control":"private, no-store"}});
  }catch(e){return operationsFailure(e);}
}
