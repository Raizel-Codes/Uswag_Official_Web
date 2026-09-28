import type { Request, Response } from 'express';
import * as procurementService from '../services/procurement.service.js';
import { ok } from '../utils/response.js';

export async function submitPurchaseRequest(req: Request, res: Response) {
  const { item, estimatedCost, event } = req.body;
  const request = await procurementService.submitPurchaseRequest(
    req.user!.id,
    item,
    Number(estimatedCost),
    event
  );
  return ok(res, request, 201);
}

export async function listPurchaseRequests(_req: Request, res: Response) {
  const requests = await procurementService.listPurchaseRequests();
  return ok(res, requests);
}

export async function listSuppliers(_req: Request, res: Response) {
  const suppliers = await procurementService.listSuppliers();
  return ok(res, suppliers);
}
