/**
 * Maps known Prisma error codes to client-facing HTTP responses so that
 * constraint/race conditions surface as 4xx instead of a generic 500.
 * Returns null for codes we don't specifically handle.
 */
export const mapPrismaError = (code: string): { statusCode: number; message: string } | null => {
  switch (code) {
    case 'P2002': // unique constraint violation
      return { statusCode: 409, message: 'A record with these details already exists' };
    case 'P2025': // record required for the operation was not found
      return { statusCode: 404, message: 'Record not found' };
    case 'P2003': // foreign key constraint violation
      return { statusCode: 409, message: 'Operation blocked by related records' };
    default:
      return null;
  }
};
