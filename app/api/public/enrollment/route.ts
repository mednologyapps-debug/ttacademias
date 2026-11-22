import { validBirthDate, validEmail, validPhone } from "@/lib/enrollment-types";
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
    if (!person.firstName || !person.lastName || [person.firstName,person.lastName].some(v => v.length > 100)
      || !/^\d{8}$/.test(person.dni) || !validEmail(person.email) || !validPhone(person.phone)
      || !validBirthDate(person.birthDate) || !field("offerId") || field("offerId").length > 36)
      throw new EnrollmentError("Revisa tus datos personales y el horario elegido.",400);
    await apply(academy,person,field("offerId"));
    return Response.json({ ok:true },{status:201});
  } catch (e) { return failure(e); }
}
