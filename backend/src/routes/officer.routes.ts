import { Router } from 'express';
import * as officerController from '../controllers/officer.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Public route for landing pages
router.get('/public', officerController.listPublicOfficers);

// Protected routes
router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.get('/', officerController.listOfficers);
router.post('/assign', officerController.assignOfficer);

export default router;
