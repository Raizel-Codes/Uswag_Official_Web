// Formatting helpers shared by the admin console pages (each page used to carry its own copy).

export function initials(name?: string | null) {
  return (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return formatDate(iso);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** ₱1,234 (whole pesos; the sign is shown by the caller). */
export function currency(n: number) {
  return `₱${Math.abs(n).toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}

export function isThisMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/**
 * The current academic year as the SERVER counts it (member.service.ts getCurrentAcademicYear:
 * a new A.Y. starts in June), so console labels match the years stored on memberships.
 * e.g. "2026–2027".
 */
export function currentAcademicYear(now = new Date()) {
  const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}–${start + 1}`;
}

/** A short, stable, readable officer ID for the ID card footer — e.g. "OFC-3F9A21C0". */
export function officerIdLabel(userId: string) {
  return `OFC-${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

/** The server's message for a failed request, else a fallback. */
export function apiError(err: unknown, fallback: string) {
  const e = err as { response?: { data?: { message?: string } }; name?: string; message?: string } | null;
  return e?.response?.data?.message ?? (e?.name === 'ForbiddenError' ? e.message : undefined) ?? fallback;
}
