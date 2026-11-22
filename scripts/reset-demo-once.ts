import {createHash} from "node:crypto";
import type {RowDataPacket} from "mysql2/promise";
import {getDb} from "../lib/db";

export async function resetDemo() {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const [tenant] = await connection.execute<RowDataPacket[]>("SELECT id FROM academies WHERE slug='demo' AND DATABASE()=? FOR UPDATE",["u629509448_ttacademias"]);
    if (tenant.length !== 1) return;
    const academy = tenant[0].id;
    const [keep] = await connection.execute<RowDataPacket[]>("SELECT id FROM users WHERE academy_id=? AND status='active' AND ((email='admin' AND role='academy_admin') OR (email='testalumno' AND role='student')) ORDER BY email FOR UPDATE",[academy]);
    const identity = createHash("sha256").update([academy,...keep.map(u => u.id)].join("|")).digest("hex");
    if (identity !== "8fe13a149f3d84412c8a538429cfc892305aaeb347085aea4bbb127a45e1e952") return;
    const [ops] = await connection.execute<RowDataPacket[]>("SELECT record_key,revision FROM academy_operations WHERE academy_id=? FOR UPDATE",[academy]);
    // Only the two revisions inventoried before the owner approved the cleanup.
    if (ops.length !== 2 || !ops.some(r=>r.record_key==="event:copa-de-demostracion" && r.revision===7) || !ops.some(r=>r.record_key==="finance" && r.revision===4)) return;
    const tables = ["ranking_entries","rankings","payments","memberships","plans","announcements","classes","courses","enrollment_requests","enrollment_offers","academy_operations"];
    for (const table of tables) await connection.execute("DELETE FROM "+table+" WHERE academy_id=?",[academy]);
    await connection.execute("DELETE FROM users WHERE academy_id=? AND id NOT IN (?,?)",[academy,keep[0].id,keep[1].id]);
    await connection.execute("INSERT INTO academy_operations (academy_id,record_key,revision,payload) VALUES (?,'maintenance:20261122',1,'true')",[academy]);
    await connection.commit();
  } finally {
    await connection.rollback();
    connection.release();
  }
}
