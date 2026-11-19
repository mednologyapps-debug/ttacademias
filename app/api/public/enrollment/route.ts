import { apply, EnrollmentError, failure, offers, publicAcademy } from "@/lib/enrollment";

export async function GET() {
  try { return Response.json({ offers: await offers(await publicAcademy()) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  try {
    const academy = await publicAcademy();
    const data = await request.json().catch(() => null);
    const field = (key: string) => typeof data?.[key] === "string" ? data[key].trim() as string : "";
    const person = { firstName: field("firstName"), lastName: field("lastName"), dni: field("dni"),
      email: field("email").toLowerCase(), phone: field("phone"), birthDate: field("birthDate") };
    const date = new Date(person.birthDate + "T12:00:00Z");
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone:"America/Lima" }).format(new Date());
    if (!person.firstName || !person.lastName || [person.firstName,person.lastName].some(v => v.length > 100)
      || !/^\d{8}$/.test(person.dni) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email) || person.email.length > 254
      || !/^\+?[0-9 ()-]+$/.test(person.phone) || !/^\d{7,15}$/.test(person.phone.replace(/\D/g,"")) || person.phone.length > 30
      || !/^\d{4}-\d{2}-\d{2}$/.test(person.birthDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== person.birthDate
      || person.birthDate < "1900-01-01" || person.birthDate > today || !field("offerId") || field("offerId").length > 36)
      throw new EnrollmentError("Revisa tus datos personales y el horario elegido.",400);
    await apply(academy,person,field("offerId"));
    return Response.json({ ok:true },{status:201});
  } catch (e) { return failure(e); }
}
