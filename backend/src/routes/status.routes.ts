import { Router } from 'express';
import { getMaintenance } from '../services/maintenance.service.js';
import { ok } from '../utils/response.js';

const router = Router();

// Public, tiny and never cached: the app asks it on load and every minute or so (the maintenance gate in
// the frontend). Says nothing about who set the switch. serverTime lets the page's countdown ignore the
// visitor's own clock.
router.get('/', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  return ok(res, { maintenance: await getMaintenance(), serverTime: new Date().toISOString() });
});

export default router;
