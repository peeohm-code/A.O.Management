import { TRPCError } from '@trpc/server';
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'INTERNAL_SERVER_ERROR',
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleDatabaseError(error: unknown, context: string): never {
  logger.error('Database error occurred', context, error);
  
  if (error instanceof Error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database operation failed. Please try again later.',
      cause: error,
    });
  }
  
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected database error occurred.',
  });
}

export function handleValidationError(message: string, details?: unknown): never {
  logger.warn('Validation error', 'Validation', { message, details });
  
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message,
    cause: details,
  });
}

export function handleAuthorizationError(message: string = 'You do not have permission to perform this action'): never {
  logger.warn('Authorization error', 'Auth', { message });
  
  throw new TRPCError({
    code: 'FORBIDDEN',
    message,
  });
}

export function handleNotFoundError(resource: string, id?: number | string): never {
  const message = id 
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  
  logger.warn('Resource not found', 'NotFound', { resource, id });
  
  throw new TRPCError({
    code: 'NOT_FOUND',
    message,
  });
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof TRPCError) {
    return error.message;
  }
  
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    logger.error('Unexpected error', 'ErrorHandler', error);
    return 'An unexpected error occurred. Please try again later.';
  }
  
  return 'An unknown error occurred. Please try again later.';
}
