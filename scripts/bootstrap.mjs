import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const required = ["DATABASE_URL", "BOOTSTRAP_ACADEMY_NAME", "BOOTSTRAP_ACADEMY_SLUG", "BOOTSTRAP_ADMIN_NAME", "BOOTSTRAP_ADMIN_EMAIL", "BOOTSTRAP_ADMIN_PASSWORD"];
for (const key of required) if (!process.env[key]) { console.error(`Falta configurar ${key}`); process.exit(1); }
if (process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 12) { console.error("BOOTSTRAP_ADMIN_PASSWORD debe tener al menos 12 caracteres."); process.exit(1); }
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [existing] = await db.execute("SELECT id FROM academies WHERE slug=? LIMIT 1", [process.env.BOOTSTRAP_ACADEMY_SLUG]);
  let academyId = existing[0]?.id;
  if (!academyId) {
    academyId = randomUUID();
    await db.execute("INSERT INTO academies (id,name,slug) VALUES (?,?,?)", [academyId, process.env.BOOTSTRAP_ACADEMY_NAME, process.env.BOOTSTRAP_ACADEMY_SLUG]);
  }
  const [admins] = await db.execute("SELECT id FROM users WHERE email=? AND role='global_admin' LIMIT 1", [process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase()]);
  if (!admins[0]) await db.execute("INSERT INTO users (id,email,password_hash,full_name,role) VALUES (?,?,?,?, 'global_admin')", [randomUUID(), process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(), await bcrypt.hash(process.env.BOOTSTRAP_ADMIN_PASSWORD, 12), process.env.BOOTSTRAP_ADMIN_NAME]);
  console.log(`Listo. Academia: ${process.env.BOOTSTRAP_ACADEMY_SLUG}.${process.env.BASE_DOMAIN || "ttacademias.com"}; admin global: ${process.env.BOOTSTRAP_ADMIN_EMAIL}`);
} finally { await db.end(); }
