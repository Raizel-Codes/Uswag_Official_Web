import { Router } from 'express';
import * as postController from '../controllers/post.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireOfficerPosition } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', postController.listPosts); // public read

import { validateBody } from '../middlewares/validation.middleware.js';
import { createManualPostSchema } from './postSchemas.js';

router.use(requireAuth);
// PRO owns NEWS content per Article VI §2(g) — Super Admin always passes too.
// Secretary owns MINUTES and ANNOUNCEMENTS.
// The requireOfficerPosition middleware allows either PRO or SECRETARY to pass.
// Finer-grained checks on type can be added to the controller if needed.
router.post('/', requireOfficerPosition('PRO', 'SECRETARY'), validateBody(createManualPostSchema), postController.createManualPost);

// PRO owns Facebook sync management per Article VI §2(g) — Super Admin always passes too.
router.get('/sync-status', requireOfficerPosition('PRO'), postController.syncStatus);
router.post('/sync', requireOfficerPosition('PRO'), postController.syncNow);

export default router;
