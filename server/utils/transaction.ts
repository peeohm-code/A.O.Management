/**
 * Transaction Utility Functions
 * Helpers for database transaction management
 */

import { getDb } from '../db/client';
import { logger } from '../logger';

/**
 * Execute a function within a database transaction
 * Automatically handles commit/rollback
 * 
 * @param callback - Function to execute within transaction
 * @returns Result from callback
 * @throws Error if transaction fails
 * 
 * @example
 * const result = await withTransaction(async (tx) => {
 *   const project = await tx.insert(projects).values(data);
 *   await tx.insert(activityLog).values({ projectId: project.id });
 *   return project;
 * });
 */
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  try {
    return await db.transaction(callback);
  } catch (error) {
    logger.error('[Transaction] Transaction failed and rolled back:', error);
    throw error;
  }
}

/**
 * Execute multiple operations in a transaction with retry logic
 * 
 * @param callback - Function to execute within transaction
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Result from callback
 * 
 * @example
 * const result = await withTransactionRetry(async (tx) => {
 *   // Your transactional operations
 * }, 3);
 */
export async function withTransactionRetry<T>(
  callback: (tx: any) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(callback);
    } catch (error) {
      lastError = error as Error;
      logger.warn(`[Transaction] Attempt ${attempt}/${maxRetries} failed:`, String(error));

      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Transaction failed after maximum retries');
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  // Don't retry validation errors, constraint violations, etc.
  const nonRetryablePatterns = [
    'duplicate',
    'unique constraint',
    'foreign key',
    'validation',
    'invalid',
  ];

  return nonRetryablePatterns.some(pattern => message.includes(pattern));
}

/**
 * Type guard for transaction context
 */
export function isTransactionContext(tx: any): boolean {
  return tx && typeof tx.transaction === 'function';
}
