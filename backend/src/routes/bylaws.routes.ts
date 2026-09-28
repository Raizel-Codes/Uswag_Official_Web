import { Router } from 'express';
import * as bylawsController from '../controllers/bylaws.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Public read — all members can view the current constitution
router.get('/amendments', bylawsController.listAmendments);

// Super Admin only — propose and resolve amendments
router.use(requireAuth, requireRole('SUPER_ADMIN'));
router.post('/amendments', bylawsController.proposeAmendment);
router.patch('/amendments/:id/resolve', bylawsController.resolveAmendment);

export default router;
