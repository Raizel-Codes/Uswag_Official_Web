import { Router } from 'express';
import * as devController from '../controllers/dev.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireDeveloper, requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// The developer's /dev console: read-only monitoring. The role check is the usual Super Admin one; the
// developer check re-reads the account from the database every time (role.middleware.ts).
router.use(requireAuth, requireRole('SUPER_ADMIN'), requireDeveloper);

router.get('/status', devController.getStatus);
router.get('/users', devController.getUsers);
router.get('/audit', devController.getAudit);
router.get('/jobs', devController.getJobs);
router.get('/config', devController.getConfig);
router.get('/errors', devController.getErrors);

export default router;
