// The last few server errors, kept in memory for the developer's /dev console. Render's own logs stay
// the record; this is a convenience that empties whenever the server restarts or the free tier sleeps.
// Messages are cut short and never include request bodies.

export interface RecordedError {
  at: string;
  message: string;
}

const MAX = 100;
const buffer: RecordedError[] = [];

function describe(part: unknown): string {
  if (part instanceof Error) return `${part.name}: ${part.message}`;
  if (typeof part === 'string') return part;
  try {
    return JSON.stringify(part);
  } catch {
    return String(part);
  }
}

export function recordError(parts: unknown[]) {
  const message = parts.map(describe).join(' · ').replace(/\s+/g, ' ').slice(0, 600);
  buffer.push({ at: new Date().toISOString(), message });
  if (buffer.length > MAX) buffer.shift();
}

/** Newest first. */
export function recentErrors(limit = 20): RecordedError[] {
  return buffer.slice(-limit).reverse();
}
