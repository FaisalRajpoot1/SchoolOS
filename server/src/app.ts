import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import rateLimit from 'express-rate-limit';

import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { apiRouter } from '@/routes';
import { errorHandler } from '@/middlewares/error.middleware';
import { notFoundHandler } from '@/middlewares/notFound.middleware';

/**
 * Builds and configures the Express application.
 * Kept free of network/process concerns so it can be imported by tests.
 */
export const createApp = (): Application => {
  const app = express();

  // Trust the first proxy (needed for correct client IPs behind Render/Railway).
  app.set('trust proxy', 1);

  // Security & infrastructure middleware.
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  // Global rate limiting.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  // API routes.
  app.use(env.API_PREFIX, apiRouter);

  // 404 + centralized error handling (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
