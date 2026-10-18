import type { Request, Response } from 'express';
import * as dev from '../services/dev.service.js';
import { ok } from '../utils/response.js';

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
