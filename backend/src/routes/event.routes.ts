import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', eventController.listEvents); // public read

import { validateBody } from '../middlewares/validation.middleware.js';
import { createEventSchema } from './eventSchemas.js';

router.use(requireAuth);
router.post('/', requireRole('SUPER_ADMIN', 'OFFICER_ADMIN'), validateBody(createEventSchema), eventController.createEvent);
router.post('/:eventId/rsvp', requireRole('MEMBER'), eventController.rsvp);

export default router;
