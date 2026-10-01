import { app } from './app.js';
import { env } from './config/env.js';
import { startFacebookSyncJob } from './jobs/facebookSync.job.js';
import { startMemberRenewalJob } from './jobs/memberRenewal.job.js';
import { isEmailConfigured } from './services/email.service.js';
import { logger } from './utils/logger.js';

app.listen(env.port, () => {
  logger.info(`USWAG backend listening on port ${env.port} (${env.nodeEnv})`);
  startFacebookSyncJob();
  startMemberRenewalJob();
  if (!isEmailConfigured()) logger.warn('Email is not configured (RESEND_API_KEY, EMAIL_FROM): password-reset links cannot be emailed.');
});
