// NwSSU student ID: YY-NNNNN (or 6 digits) — enrollment year, then the student's number that year,
// e.g. 23-00877. Mirrors studentIdField in backend/src/routes/memberSchemas.ts.
export const STUDENT_ID_PATTERN = /^\d{2}-\d{5,6}$/;

/** Digits only, hyphen inserted after the year: "2300877" → "23-00877". */
export function formatStudentId(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
}

/** The first problem with a typed student ID, or null when it's fine. */
export function studentIdProblem(id: string): string | null {
  if (!STUDENT_ID_PATTERN.test(id)) return 'Enter your student ID like 23-00877 (year, hyphen, then 5 or 6 digits).';
  if (Number(id.slice(0, 2)) > new Date().getFullYear() % 100) return 'That enrollment year hasn’t happened yet. Check the first two digits.';
  return null;
}
