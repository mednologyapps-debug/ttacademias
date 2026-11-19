export const enrollmentLevels = ["Básico", "Intermedio", "Avanzado"] as const;
export type Offer = { id: string; venue: string; level: string; schedule: string };
export type Applicant = { firstName: string; lastName: string; dni: string; email: string; phone: string; birthDate: string };
export type Enrollment = Applicant & Offer & { createdAt: string };
