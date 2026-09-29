import { Router } from 'express';
import * as officerController from '../controllers/officer.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { installTermSchema } from './officerSchemas.js';

const router = Router();

router.get('/public', officerController.listPublicOfficers);

router.get('/me/qr', requireAuth, requireRole('SUPER_ADMIN', 'OFFICER_ADMIN'), officerController.getMyOfficerQr);

router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.get('/', officerController.listOfficers);
router.get('/nominees', officerController.listNomineesHandler);
router.post('/assign', officerController.assignOfficer);
router.post('/term', validateBody(installTermSchema), officerController.installOfficerTerm);

export default router;
