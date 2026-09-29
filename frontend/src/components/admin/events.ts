import type { UswagEvent } from '@/types/event.types';

/** Event status → standing-chip tone (.mp-standing--*). */
export const EVENT_BADGE: Record<UswagEvent['status'], string> = {
  CONFIRMED: 'mp-standing--active',
  DRAFT: 'mp-standing--pending',
  COMPLETED: 'mp-standing--neutral',
  CANCELLED: 'mp-standing--rejected',
};

/**
 * Sign-ups as a Meter: against the slot limit for out-of-campus events (flagged as it fills),
 * otherwise relative to the busiest event in view so in-campus RSVPs still compare at a glance.
 */
export function signupMeter(e: UswagEvent, busiest: number) {
  const n = e._count?.rsvps ?? 0;
  if (e.limitedSlots) {
    const pct = (n / e.limitedSlots) * 100;
    return { percent: pct, text: `${n} / ${e.limitedSlots}`, tone: pct >= 100 ? ('danger' as const) : pct >= 80 ? ('warn' as const) : ('primary' as const) };
  }
  return { percent: busiest ? (n / busiest) * 100 : 0, text: `${n} going`, tone: 'primary' as const };
}
