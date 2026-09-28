import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireOfficerPosition } from '../middlewares/role.middleware.js';

const router = Router();

router.use(requireAuth);

// Org-wide attendance oversight — Auditor (Article VI read-only scope) +
// Super Admin. requireOfficerPosition lets Super Admin (and the VP, who is
// Super-Admin-equivalent — see role.middleware.ts) through automatically.
const canReadAttendance = requireOfficerPosition('AUDITOR');
router.get('/', canReadAttendance, attendanceController.listAttendance);
router.get('/stats', canReadAttendance, attendanceController.getStats);

export default router;
