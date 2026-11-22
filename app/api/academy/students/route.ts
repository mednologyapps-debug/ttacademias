import {randomUUID} from "node:crypto";
import bcrypt from "bcryptjs";
import type {RowDataPacket} from "mysql2";
import {adminAcademy,EnrollmentError} from "@/lib/enrollment";
import {operationsFailure} from "@/lib/operations-store";
import {getDb} from "@/lib/db";

export async function POST(request:Request){
  try{
    const academy=await adminAcademy();
    const {row,original,password,remove}=await request.json();
    if(!Array.isArray(row) || row.length!==7)throw new EnrollmentError("Ficha inválida.",400);
    const [name,dni,birth,level,email,phone]=row;
    if(!remove && (!name?.trim() || (dni && !/^\d{8}$/.test(dni)) || !email || (!original && (!dni || !password || password.length<10))))throw new EnrollmentError("Revisa nombre, DNI, correo y contraseña inicial.",400);
    const db=await getDb().getConnection();
    try{
      await db.beginTransaction();
      let id=randomUUID() as string;
      if(original){
        const [rows]=await db.execute<RowDataPacket[]>("SELECT id,full_name FROM users WHERE academy_id=? AND role='student' AND status='active' AND email=? FOR UPDATE",[academy,original]);
        if(!rows.length)throw new EnrollmentError("Alumno no encontrado.",404);
        id=rows[0].id;
        if(remove || rows[0].full_name!==name){
          const [assigned]=await db.execute<RowDataPacket[]>("SELECT course_id FROM course_students WHERE student_id=? LIMIT 1",[id]);
          if(assigned.length)throw new EnrollmentError("Retira primero al alumno de sus cursos para cambiar su nombre o desactivarlo.",409);
        }
        if(remove)await db.execute("UPDATE users SET status='suspended' WHERE id=? AND academy_id=?",[id,academy]);
        else await db.execute("UPDATE users SET full_name=?,dni=?,birth_date=?,email=?,phone=? WHERE id=? AND academy_id=?",[name,dni||null,birth||null,email,phone,id,academy]);
      }else await db.execute("INSERT INTO users (id,academy_id,full_name,dni,birth_date,email,phone,password_hash,role) VALUES (?,?,?,?,?,?,?,?,'student')",[id,academy,name,dni,birth||null,email.toLowerCase(),phone,await bcrypt.hash(password,12)]);
      if(!remove)await db.execute("INSERT INTO academy_operations (academy_id,record_key,revision,payload) VALUES (?,?,1,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload),revision=revision+1",[academy,"level:"+id,JSON.stringify(level)]);
      await db.commit();return Response.json({ok:true});
    }catch(e){await db.rollback();if((e as {code?:string}).code==="ER_DUP_ENTRY")throw new EnrollmentError("El DNI o correo ya está registrado.",409);throw e;}finally{db.release();}
  }catch(e){return operationsFailure(e);}
}
