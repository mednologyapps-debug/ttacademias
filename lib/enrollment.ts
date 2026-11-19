import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDb } from "./db";
import { getAcademySlug } from "./tenant";
import { getCurrentUser } from "./auth";
import { enrollmentLevels, type Applicant, type Enrollment, type Offer } from "./enrollment-types";

const demo = "local-enrollment-demo";
const isLocalDemo = () => process.env.NODE_ENV === "development" && (!process.env.DATABASE_URL || process.env.DATABASE_URL === "mysql://USER:PASSWORD@HOST:3306/DATABASE");
export class EnrollmentError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
export function failure(error: unknown) {
  return Response.json({ error: error instanceof EnrollmentError ? error.message : "No pudimos conectar con matrícula. Vuelve a intentarlo." },
    { status: error instanceof EnrollmentError ? error.status : 503 });
}
export async function publicAcademy() {
  const slug = await getAcademySlug();
  const host = ((await headers()).get("host") || "").split(":")[0];
  if (isLocalDemo() && ["localhost", "127.0.0.1"].includes(host)) return demo;
  if (!slug) throw new EnrollmentError("Abre la página de tu academia para matricularte.", 404);
  const [rows] = await getDb().execute<RowDataPacket[]>("SELECT id FROM academies WHERE slug=? AND status='active'", [slug]);
  if (!rows[0]) throw new EnrollmentError("Academia no disponible.", 404);
  return String(rows[0].id);
}
export async function adminAcademy() {
  const user = await getCurrentUser();
  if (user?.role === "academy_admin") {
    if (user.academyId) return user.academyId;
    if (isLocalDemo() && user.id === "local-demo-admin") return demo;
  }
  throw new EnrollmentError("Acceso restringido al administrador de la academia.", 403);
}

// The localhost demo works across browsers without a configured MySQL server.
type DemoData = { offers: Offer[]; requests: (Enrollment & { offerId: string })[] };
const demoFile = path.join(process.cwd(), ".local-enrollment", "demo.json");
const demoState = globalThis as typeof globalThis & { enrollmentWriteQueue?: Promise<void> };
function demoStore<T>(run: (data: DemoData) => T, save = false): Promise<T> {
  const next = (demoState.enrollmentWriteQueue ?? Promise.resolve()).then(async () => {
    let data: DemoData;
    try { data = JSON.parse(await readFile(demoFile, "utf8")); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      data = { offers: enrollmentLevels.map((level, i) => ({
        id: "demo-" + i, level, venue: "Miraflores", schedule: ["Miércoles · 4:00 p. m.", "Lunes · 6:00 p. m.", "Sábado · 10:00 a. m."][i]
      })), requests: [] };
    }
    const value = run(data);
    if (save) {
      await mkdir(path.dirname(demoFile), { recursive: true, mode: 0o700 });
      const tmp = demoFile + "." + randomUUID();
      await writeFile(tmp, JSON.stringify(data), { mode: 0o600 });
      await rename(tmp, demoFile);
    }
    return value;
  });
  demoState.enrollmentWriteQueue = next.then(() => {}, () => {});
  return next;
}
export async function offers(academy: string): Promise<Offer[]> {
  if (academy === demo) return demoStore(data => data.offers);
  const [rows] = await getDb().execute<(Offer & RowDataPacket)[]>("SELECT id,venue,level,schedule FROM enrollment_offers WHERE academy_id=? ORDER BY venue,level,schedule", [academy]);
  return rows;
}
export async function addOffer(academy: string, offer: Offer) {
  if (academy === demo) return demoStore(data => {
    if (data.offers.some(o => o.level === offer.level && o.schedule === offer.schedule && o.venue.toLowerCase() === offer.venue.toLowerCase())) throw new EnrollmentError("Ese horario ya está publicado.", 409);
    data.offers.push(offer);
  }, true);
  try { await getDb().execute("INSERT INTO enrollment_offers (id,academy_id,venue,level,schedule) VALUES (?,?,?,?,?)", [offer.id, academy, offer.venue, offer.level, offer.schedule]); }
  catch (e) { if ((e as {code?:string}).code === "ER_DUP_ENTRY") throw new EnrollmentError("Ese horario ya está publicado.", 409); throw e; }
}
export async function removeOffer(academy: string, id: string) {
  if (academy === demo) return demoStore(data => { data.offers = data.offers.filter(o => o.id !== id); }, true);
  await getDb().execute("DELETE FROM enrollment_offers WHERE academy_id=? AND id=?", [academy,id]);
}
export async function inbox(academy: string): Promise<Enrollment[]> {
  if (academy === demo) return demoStore(data => data.requests);
  const [rows] = await getDb().execute<(Enrollment & RowDataPacket)[]>(
    "SELECT id,first_name AS firstName,last_name AS lastName,dni,email,phone,DATE_FORMAT(birth_date,'%Y-%m-%d') AS birthDate,level,venue,schedule,created_at AS createdAt FROM enrollment_requests WHERE academy_id=? ORDER BY created_at DESC,id", [academy]);
  return rows;
}
export async function apply(academy: string, person: Applicant, offerId: string) {
  const id = randomUUID();
  const unavailable = () => new EnrollmentError("Ese horario ya no está disponible. Elige otro para continuar.", 409);
  if (academy === demo) return demoStore(data => {
    const offer = data.offers.find(o => o.id === offerId);
    if (!offer) throw unavailable();
    if (!data.requests.some(r => r.dni === person.dni && r.offerId === offerId))
      data.requests.unshift({ ...person, ...offer, id, offerId, createdAt: new Date().toISOString() });
  }, true);
  // Resolve all public choices from the same tenant at insertion, retaining the snapshot for the inbox.
  try {
    const [result] = await getDb().execute<ResultSetHeader>(
      `INSERT INTO enrollment_requests (id,first_name,last_name,dni,email,phone,birth_date,academy_id,offer_id,venue,level,schedule)
       SELECT ?,?,?,?,?,?,?,academy_id,id,venue,level,schedule FROM enrollment_offers WHERE id=? AND academy_id=?`,
      [id,person.firstName,person.lastName,person.dni,person.email,person.phone,person.birthDate,offerId,academy]);
    if (!result.affectedRows) throw unavailable();
  } catch (e) { if ((e as {code?:string}).code !== "ER_DUP_ENTRY") throw e; }
}
