import { Router } from 'express';
import authRoutes from './auth.routes.js';
import memberRoutes from './member.routes.js';
import eventRoutes from './event.routes.js';
import scanRoutes from './scan.routes.js';
import postRoutes from './post.routes.js';
import officerRoutes from './officer.routes.js';
import bylawsRoutes from './bylaws.routes.js';
import auditRoutes from './audit.routes.js';
import notificationRoutes from './notification.routes.js';
import financeRoutes from './finance.routes.js';
import procurementRoutes from './procurement.routes.js';
import attendanceRoutes from './attendance.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/events', eventRoutes);
router.use('/scan', scanRoutes);
router.use('/posts', postRoutes);
router.use('/officers', officerRoutes);
router.use('/bylaws', bylawsRoutes);
router.use('/audit-log', auditRoutes);
router.use('/notifications', notificationRoutes);
router.use('/finance', financeRoutes);
router.use('/procurement', procurementRoutes);
router.use('/attendance', attendanceRoutes);

export default router;

