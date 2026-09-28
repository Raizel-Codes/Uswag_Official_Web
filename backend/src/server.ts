import { app } from './app.js';
import { env } from './config/env.js';
import { startFacebookSyncJob } from './jobs/facebookSync.job.js';
import { logger } from './utils/logger.js';

app.listen(env.port, () => {
  logger.info(`USWAG backend listening on port ${env.port} (${env.nodeEnv})`);
  startFacebookSyncJob();
});
