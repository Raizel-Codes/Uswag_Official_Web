import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import * as eventService from '../services/event.service.js';
import { logAction } from '../services/audit.service.js';
import { ok } from '../utils/response.js';

export async function listEvents(_req: Request, res: Response) {
  const events = await eventService.listEvents();
  return ok(res, events);
}

export async function createEvent(req: Request, res: Response) {
  const event = await eventService.createEvent(req.body);
  await logAction(req.user!.id, 'event.create', 'UswagEvent', event.id);
  return ok(res, event, 201);
}

export async function rsvp(req: Request, res: Response) {
  const { eventId } = req.params;
  
  const profile = await prisma.memberProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) return res.status(403).json({ success: false, message: 'Only members can RSVP' });

  const record = await eventService.rsvpToEvent(eventId, profile.id, 'going');
  return ok(res, record);
}
