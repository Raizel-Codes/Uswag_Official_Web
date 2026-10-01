import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { loginRateLimiter, forgotPasswordRateLimiter } from '../middlewares/rateLimit.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { forgotPasswordSchema, requestResetHelpSchema, resetPasswordSchema } from './authSchemas.js';

const router = Router();

router.post('/login', loginRateLimiter, authController.login);
router.post('/refresh', authController.refresh);
// Revokes the calling user's sessions (bumps tokenVersion) — needs to know
// who's logging out, so this runs behind requireAuth like everything else
// that reads req.user.
router.post('/logout', requireAuth, authController.logout);

router.post('/forgot-password', forgotPasswordRateLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
// How a forgotten password is recovered on this server: by email once mail is set up, otherwise by asking an officer.
router.get('/reset-options', authController.resetOptions);
router.post('/request-reset-help', forgotPasswordRateLimiter, validateBody(requestResetHelpSchema), authController.requestResetHelp);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

router.patch('/me/preference', requireAuth, authController.updatePreference);

export default router;
