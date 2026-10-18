import { Router } from 'express';
import * as financeController from '../controllers/finance.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireOfficerPosition, requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// All finance routes require authentication
router.use(requireAuth);

// ---- Read endpoints — Treasurer + Auditor + Super Admin ----
// requireOfficerPosition accepts multiple positions; Super Admin (and the VP,
// who is Super-Admin-equivalent — see role.middleware.ts) always passes.
const canReadFinance = requireOfficerPosition('TREASURER', 'AUDITOR');
router.get('/summary', canReadFinance, financeController.getFinanceSummary);
router.get('/entries', canReadFinance, financeController.listFinanceEntries);
router.get('/roster', canReadFinance, financeController.getFeeRoster);

// ---- Write endpoints — Treasurer + Super Admin ONLY ----
// Auditor intentionally excluded here; will get 403 if they somehow hit these.
const canWriteFinance = requireOfficerPosition('TREASURER');
router.post('/dues', canWriteFinance, financeController.recordDues);
router.post('/roster/:memberId/extend', canWriteFinance, financeController.extendApplication);
router.post('/expense', canWriteFinance, financeController.recordExpense);

export default router;
