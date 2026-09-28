/** Academic year label for a date, e.g. "2026–2027". NwSSU's A.Y. starts around August. */
export function academicYearLabel(now = new Date()) {
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}–${start + 1}`;
}
