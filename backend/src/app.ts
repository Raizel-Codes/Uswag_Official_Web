import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './config/cors.js';
import { prisma } from './config/db.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

export const app = express();

// Railway/Render sit the app behind a reverse proxy — without this,
// req.ip resolves to the proxy's address, not the client's, which breaks
// per-IP rate limiting (loginRateLimiter/applyRateLimiter in
// rateLimit.middleware.ts) by bucketing every visitor into one shared limit.
app.set('trust proxy', 1);

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

app.get('/health', async (_req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: { status: 'up', latencyMs: Date.now() - start },
    });
  } catch (err) {
    // Non-200 so uptime monitors and platform health checks actually flag this,
    // instead of the old unconditional { status: 'ok' } masking a dead database.
    res.status(503).json({
      status: 'error',
      database: {
        status: 'down',
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'Unknown database error',
      },
    });
  }
});

app.use('/api/v1', routes);

app.use(errorHandler);
