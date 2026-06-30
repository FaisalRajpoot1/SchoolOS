import { pino } from 'pino';
import { env, isProduction } from '@/config/env';

/**
 * Structured application logger.
 * Pretty-prints in development, emits JSON in production for log aggregators.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      }),
});
