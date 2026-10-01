import { Router } from 'express';
import * as memberController from '../controllers/member.controller.js';
import * as attendanceController from '../controllers/attendance.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireOfficerPosition, requireRole } from '../middlewares/role.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { approveApplicationSchema, issueResetLinkSchema, rejectApplicationSchema, renewMemberSchema, submitApplicationSchema } from './memberSchemas.js';
import { applyRateLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Public — no auth. A prospective member submits this before they have any
// account to log into (see claude.md Art. III — anyone may apply). It lands
// in the same PENDING queue the Secretary/Super Admin already review.
// Rate-limited: this is an unauthenticated endpoint that writes to the DB.
router.post('/apply', applyRateLimiter, validateBody(submitApplicationSchema), memberController.submitApplication);

router.use(requireAuth);

router.get('/me', memberController.getMyProfile);
router.get('/me/qr', memberController.getMyQr);
router.get('/me/attendance', attendanceController.getMyAttendance);

// Secretary owns membership records per Article VI §2(c) — Super Admin (and
// the VP, who is Super-Admin-equivalent — see role.middleware.ts) always
// passes too.
router.get('/', requireOfficerPosition('SECRETARY'), memberController.listMembers);
router.post('/:memberId/approve', requireOfficerPosition('SECRETARY'), validateBody(approveApplicationSchema), memberController.approveApplication);
router.post('/:memberId/reject', requireOfficerPosition('SECRETARY'), validateBody(rejectApplicationSchema), memberController.rejectApplication);
// Article III §3: membership lasts one academic year and is renewable. The renewal job expires
// lapsed members; the Secretary renews them here.
router.post('/:memberId/renew', requireOfficerPosition('SECRETARY'), validateBody(renewMemberSchema), memberController.renewMember);
// Application review aids (Secretary): the temporary, encrypted student ID,
// and the one-time password-setup link for friend-assisted applicants.
// Officer-assisted password reset. Registered before the /:memberId routes; the service decides, per
// account, who may act (Secretary: members only; Super Admin / VP: everyone but themselves).
router.get('/reset-requests', requireOfficerPosition('SECRETARY'), memberController.listResetRequests);
router.post('/reset-requests/:userId/link', requireOfficerPosition('SECRETARY'), validateBody(issueResetLinkSchema), memberController.issueResetLink);
router.post('/reset-requests/:userId/dismiss', requireOfficerPosition('SECRETARY'), memberController.dismissResetRequest);
router.get('/:memberId/student-id', requireOfficerPosition('SECRETARY'), memberController.revealStudentId);
router.post('/:memberId/setup-link', requireOfficerPosition('SECRETARY'), memberController.createSetupLink);

export default router;
