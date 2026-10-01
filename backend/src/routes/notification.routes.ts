import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = Router();

// Public — frontend needs the VAPID public key before the user logs in
// so the Service Worker can subscribe during the registration flow.
router.get('/vapid-public-key', notificationController.getVapidPublicKey);

// Authenticated routes
router.use(requireAuth);

// The caller's inbox
router.get('/', notificationController.listMine);
router.post('/mark-all-read', notificationController.readAll);
router.post('/:id/read', notificationController.readOne);

// Save / remove a PushSubscription from the browser
router.post('/subscribe', notificationController.subscribe);
router.post('/unsubscribe', notificationController.unsubscribe);

// Dev-only: fire a test push to the authenticated caller's devices
router.post('/test', notificationController.sendTestPush);

export default router;
