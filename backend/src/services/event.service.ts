import { prisma } from '../config/db.js';

// Drafts are officers' working copies: not shown on public or member pages, not joinable, and no
// one is notified about them. Publishing one (publishEvent) confirms it and is when members hear.

/** Everything the public and members may see — drafts excluded. */
export function listEvents() {
  return prisma.uswagEvent.findMany({
    where: { status: { not: 'DRAFT' } },
    orderBy: { startsAt: 'asc' },
    include: { _count: { select: { rsvps: true } } },
  });
}

/** Officers' unpublished events. */
export function listDraftEvents() {
  return prisma.uswagEvent.findMany({
    where: { status: 'DRAFT' },
    orderBy: { startsAt: 'asc' },
    include: { _count: { select: { rsvps: true } } },
  });
}

export function createEvent(data: Parameters<typeof prisma.uswagEvent.create>[0]['data']) {
  return prisma.uswagEvent.create({ data });
}

/** DRAFT → CONFIRMED. Returns null unless the event exists and is still a draft (so a double click can't notify twice). */
export async function publishEvent(eventId: string) {
  const { count } = await prisma.uswagEvent.updateMany({ where: { id: eventId, status: 'DRAFT' }, data: { status: 'CONFIRMED' } });
  if (count === 0) return null;
  return prisma.uswagEvent.findUnique({ where: { id: eventId } });
}

export function rsvpToEvent(eventId: string, memberId: string, status: string) {
  return prisma.eventRsvp.upsert({
    where: { eventId_memberId: { eventId, memberId } },
    update: { status },
    create: { eventId, memberId, status },
  });
}
