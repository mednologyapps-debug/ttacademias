import { enrollmentLevels, validBirthDate, validEmail, validPhone } from "@/lib/enrollment-types";
import type { Finance } from "@/lib/course-finance";
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
    if (!Array.isArray(row) || row.length !== 7 || !row.every(v => typeof v === "string") || (remove && !original))
      throw new EnrollmentError("Ficha inválida.",400);
    const [name,dni,birth,level,identifier,phone] = row.map((v: string) => v.trim());
    const email = identifier.toLowerCase();
    const existingAlias = original === email && !email.includes("@");
    if (!remove) {
      if (!name || name.length > 160 || !(validEmail(email) || existingAlias))
        throw new EnrollmentError("Revisa el nombre y el correo del alumno.",400);
      if ((dni || !original) && !/^\d{8}$/.test(dni)) throw new EnrollmentError("El DNI debe tener ocho dígitos.",400);
      if ((birth || !original) && !validBirthDate(birth)) throw new EnrollmentError("Revisa la fecha de nacimiento.",400);
      if ((phone || !original) && !validPhone(phone)) throw new EnrollmentError("Revisa el celular.",400);
      if (![...enrollmentLevels, ...(original ? ["Sin asignar"] : [])].includes(level)) throw new EnrollmentError("Selecciona un nivel válido.",400);
      if (!original && (typeof password !== "string" || password.length < 10)) throw new EnrollmentError("La contraseña inicial debe tener al menos 10 caracteres.",400);
    }
    const db=await getDb().getConnection();
    try{
      await db.beginTransaction();
      await db.execute("SELECT id FROM academies WHERE id=? FOR UPDATE",[academy]);
      let id=randomUUID() as string;
      if(original){
        const [rows]=await db.execute<RowDataPacket[]>("SELECT id,full_name FROM users WHERE academy_id=? AND role='student' AND status='active' AND email=? FOR UPDATE",[academy,original]);
        if(!rows.length)throw new EnrollmentError("Alumno no encontrado.",404);
        id=rows[0].id;
        if (remove || rows[0].full_name !== name) {
          const [assigned] = await db.execute<RowDataPacket[]>("SELECT course_id FROM course_students WHERE student_id=?", [id]);
          if (remove && assigned.length) throw new EnrollmentError("Retira primero al alumno de sus cursos para desactivarlo.",409);
          if (!remove) {
            const [stored] = await db.execute<RowDataPacket[]>("SELECT CAST(payload AS CHAR CHARACTER SET utf8mb4) AS payload FROM academy_operations WHERE academy_id=? AND record_key='finance' FOR UPDATE",[academy]);
            if (stored.length) {
              const finance: Finance = JSON.parse(stored[0].payload);
              const ids = new Set(assigned.map(r => r.course_id));
              for (const course of finance.courses.filter(c => ids.has(c.id))) {
                if (course.students.includes(name)) throw new EnrollmentError("Ya hay un alumno con ese nombre en el curso.",409);
                course.students = course.students.map(n => n === rows[0].full_name ? name : n);
              }
              for (const receipt of finance.receipts) if (receipt.studentId === id) receipt.student = name;
              await db.execute("UPDATE academy_operations SET payload=?, revision=revision+1 WHERE academy_id=? AND record_key='finance'",[JSON.stringify(finance),academy]);
            }
          }
        }
        if(remove)await db.execute("UPDATE users SET status='suspended' WHERE id=? AND academy_id=?",[id,academy]);
        else await db.execute("UPDATE users SET full_name=?,dni=?,birth_date=?,email=?,phone=? WHERE id=? AND academy_id=?",[name,dni||null,birth||null,email,phone,id,academy]);
      }else await db.execute("INSERT INTO users (id,academy_id,full_name,dni,birth_date,email,phone,password_hash,role) VALUES (?,?,?,?,?,?,?,?,'student')",[id,academy,name,dni,birth||null,email.toLowerCase(),phone,await bcrypt.hash(password,12)]);
      if(!remove)await db.execute("INSERT INTO academy_operations (academy_id,record_key,revision,payload) VALUES (?,?,1,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload),revision=revision+1",[academy,"level:"+id,JSON.stringify(level)]);
      await db.commit();return Response.json({ok:true});
    }catch(e){await db.rollback();if((e as {code?:string}).code==="ER_DUP_ENTRY")throw new EnrollmentError("El DNI o correo ya está registrado.",409);throw e;}finally{db.release();}
  }catch(e){return operationsFailure(e);}
}
