import { Router } from 'express';
import * as scanController from '../controllers/scan.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(requireAuth);

// Every Officer Admin position except Auditor can scan — see claude.md
// "Roles & permissions". Enforced here, not just hidden in the frontend nav.
router.post(
  '/',
  requireRole('SUPER_ADMIN', 'OFFICER_ADMIN'),
  (req, res, next) => {
    if (req.user?.officerPosition === 'AUDITOR') {
      return res.status(403).json({ success: false, message: "Scanning is outside the Auditor's scope (Article VI)" });
    }
    next();
  },
  scanController.verifyScan,
);

export default router;
