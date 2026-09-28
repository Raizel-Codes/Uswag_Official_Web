import { prisma } from '../config/db.js';

export function listEvents() {
  return prisma.uswagEvent.findMany({
    orderBy: { startsAt: 'asc' },
    include: { _count: { select: { rsvps: true } } },
  });
}

export function createEvent(data: Parameters<typeof prisma.uswagEvent.create>[0]['data']) {
  return prisma.uswagEvent.create({ data });
}

export function rsvpToEvent(eventId: string, memberId: string, status: string) {
  return prisma.eventRsvp.upsert({
    where: { eventId_memberId: { eventId, memberId } },
    update: { status },
    create: { eventId, memberId, status },
  });
}
