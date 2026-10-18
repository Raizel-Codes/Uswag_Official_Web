import { recordError } from './errorBuffer.js';

// Minimal logger placeholder. Swap for pino/winston before production
// if structured logging or log shipping is needed.
export const logger = {
  info: (...args: unknown[]) => console.log('[info]', ...args),
  warn: (...args: unknown[]) => console.warn('[warn]', ...args),
  error: (...args: unknown[]) => {
    console.error('[error]', ...args);
    recordError(args); // the /dev console's recent errors
  },
};
