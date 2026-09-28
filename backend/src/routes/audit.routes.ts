import { Router } from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('SUPER_ADMIN'));
router.get('/', auditController.listAuditLog);

export default router;
