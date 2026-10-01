import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import * as eventService from '../services/event.service.js';
import { standingBlock } from '../services/member.service.js';
import { effectiveStatus } from '../utils/academicYear.js';
import { logAction } from '../services/audit.service.js';
import { ok, fail } from '../utils/response.js';

export async function listEvents(_req: Request, res: Response) {
  const events = await eventService.listEvents();
  return ok(res, events);
}

export async function createEvent(req: Request, res: Response) {
  const event = await eventService.createEvent(req.body);
  await logAction(req.user!.id, 'event.create', 'UswagEvent', event.id);
  return ok(res, event, 201);
}

// Only ACTIVE members may RSVP / apply (Article III) — pending, expired and
// rejected members get 403 with the reason. Out-of-campus events record an
// "applied" RSVP (officers confirm limited slots); in-campus ones "going".
export async function rsvp(req: Request, res: Response) {
  const { eventId } = req.params;

  const profile = await prisma.memberProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) return fail(res, 'Only members can RSVP', 403);
  const standing = effectiveStatus(profile);
  const blocked = standingBlock(standing);
  if (blocked) return fail(res, blocked, 403, { standing: standing.toLowerCase() });

  const event = await prisma.uswagEvent.findUnique({ where: { id: eventId } });
  if (!event) return fail(res, 'Event not found', 404);
  if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
    return fail(res, `This event is ${event.status.toLowerCase()} and no longer takes sign-ups.`, 409);
  }

  const record = await eventService.rsvpToEvent(eventId, profile.id, event.scope === 'OUT_OF_CAMPUS' ? 'applied' : 'going');
  return ok(res, record);
}

// GET /events/me/rsvps — the signed-in member's own RSVPs, so "Going ✓"
// survives a reload and the dashboard can count events actually joined.
export async function myRsvps(req: Request, res: Response) {
  const profile = await prisma.memberProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) return fail(res, 'Member profile not found', 404);
  const rsvps = await prisma.eventRsvp.findMany({
    where: { memberId: profile.id },
    select: { eventId: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, rsvps);
}
