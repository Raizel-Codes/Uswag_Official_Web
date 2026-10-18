import type { Request, Response } from 'express';
import * as dev from '../services/dev.service.js';
import * as maintenance from '../services/maintenance.service.js';
import { MaintenanceError } from '../services/maintenance.service.js';
import { ok, fail } from '../utils/response.js';

// Thin on purpose: each handler is one read-only dev.service query. The optional ?n= is a row count
// for the commands that list things (audit, errors).
const count = (req: Request) => {
  const n = Number(req.query.n);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20;
};

export const getStatus = async (_req: Request, res: Response) => ok(res, await dev.status());
export const getUsers = async (_req: Request, res: Response) => ok(res, await dev.users());
export const getAudit = async (req: Request, res: Response) => ok(res, await dev.audit(count(req)));
export const getJobs = (_req: Request, res: Response) => ok(res, dev.jobs());
export const getConfig = (_req: Request, res: Response) => ok(res, dev.config());
export const getErrors = (req: Request, res: Response) => ok(res, dev.errors(count(req)));

export const getMaintenance = async (_req: Request, res: Response) => ok(res, await maintenance.getMaintenance());

// The one thing the view-only developer account may change (auth.middleware.ts allows exactly this write):
// the site-wide maintenance switch. Each change writes one audit entry (maintenance.service.ts).
export async function changeMaintenance(req: Request, res: Response) {
  const { action, minutes, message, force } = req.body as { action: 'on' | 'off' | 'extend'; minutes?: number; message?: string; force?: boolean };
  try {
    const actor = req.user!.id;
    const state =
      action === 'on' ? await maintenance.turnOn(actor, { minutes, message, force }) : action === 'off' ? await maintenance.turnOff(actor) : await maintenance.extend(actor, minutes ?? 30);
    return ok(res, state);
  } catch (err) {
    if (err instanceof MaintenanceError) return fail(res, err.message, err.status, err.details);
    throw err;
  }
}
