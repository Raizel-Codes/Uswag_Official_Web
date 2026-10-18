import { Router } from 'express';
import * as accountController from '../controllers/account.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { deleteAccountSchema } from './accountSchemas.js';

const router = Router();

// Deleting an account is permanent, so it is Super Admin only (Art. VI: officer account management).
router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.get('/:userId/impact', accountController.getDeletionImpact);
router.delete('/:userId', validateBody(deleteAccountSchema), accountController.removeAccount);

export default router;
