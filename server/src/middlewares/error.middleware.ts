import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '@/utils/ApiError';
import { mapPrismaError } from '@/utils/prismaError';
import { logger } from '@/utils/logger';
import { isProduction } from '@/config/env';

interface ErrorResponse {
  success: false;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * Central error handler. Normalizes ApiError, ZodError, and unknown
 * errors into a consistent JSON envelope.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // next is required for Express to recognize this as an error handler.
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Validation failed';
    details = err.flatten();
  } else if (err instanceof Prisma.PrismaClientKnownRequestError && mapPrismaError(err.code)) {
    const mapped = mapPrismaError(err.code)!;
    statusCode = mapped.statusCode;
    message = mapped.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error({ err }, 'Unhandled error');
  }

  const body: ErrorResponse = { success: false, message };
  if (details !== undefined) body.details = details;
  if (!isProduction && err instanceof Error) body.stack = err.stack;

  res.status(statusCode).json(body);
};
