export const enrollmentLevels = ["Básico", "Intermedio", "Avanzado"] as const;
export type Offer = { id: string; venue: string; level: string; schedule: string };
export type Applicant = { firstName: string; lastName: string; dni: string; email: string; phone: string; birthDate: string };
export type Enrollment = Applicant & Offer & { createdAt: string };

export function validBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01") return false;
  const date = new Date(value + "T12:00:00Z");
  const today = new Intl.DateTimeFormat("sv-SE", {timeZone:"America/Lima"}).format(new Date());
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value && value <= today;
}

export function validPhone(value: string) {
  return value.length <= 30 && /^\+?[0-9 ()-]+$/.test(value) && /^\d{7,15}$/.test(value.replace(/\D/g,""));
}

export function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
