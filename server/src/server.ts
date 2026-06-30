import type { Server } from 'node:http';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { prisma } from '@/db/prisma';

/** Application entry point: starts the HTTP server and wires lifecycle hooks. */
const bootstrap = async (): Promise<void> => {
  const app = createApp();

  const server: Server = app.listen(env.PORT, () => {
    logger.info(`🚀 SchoolOS API listening on http://localhost:${env.PORT}${env.API_PREFIX}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Closed HTTP server and database connections');
      process.exit(0);
    });

    // Force exit if graceful shutdown stalls.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — exiting');
    process.exit(1);
  });
};

void bootstrap();
