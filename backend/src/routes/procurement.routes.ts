import { Router } from 'express';
import * as procurementController from '../controllers/procurement.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireOfficerPosition } from '../middlewares/role.middleware.js';

const router = Router();

router.use(requireAuth);

// Business Manager owns procurement per Article VI §2(e) — Super Admin (and
// the VP, who is Super-Admin-equivalent — see role.middleware.ts) always
// passes too.
const canManageProcurement = requireOfficerPosition('BUSINESS_MANAGER');

router.get('/requests', canManageProcurement, procurementController.listPurchaseRequests);
router.post('/requests', canManageProcurement, procurementController.submitPurchaseRequest);
router.get('/suppliers', canManageProcurement, procurementController.listSuppliers);

export default router;
