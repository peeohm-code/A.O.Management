/**
 * Database Client
 * Centralized Drizzle ORM connection pool management
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql, { type Pool, type PoolConnection } from 'mysql2/promise';
import { DB_CONFIG } from '../utils/constants';
import { logger } from '../logger';

// Type for Drizzle database instance
export type DbInstance = ReturnType<typeof drizzle>;

// Singleton instances
let _db: DbInstance | null = null;
let _pool: Pool | null = null;

/**
 * Get or create the Drizzle database instance
 * Uses connection pooling for optimal performance
 * 
 * @returns Drizzle database instance or null if connection fails
 */
export async function getDb(): Promise<DbInstance | null> {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create connection pool with optimized settings
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: DB_CONFIG.CONNECTION_LIMIT,
        waitForConnections: true,
        queueLimit: 0, // Unlimited queue
        enableKeepAlive: true,
        keepAliveInitialDelay: DB_CONFIG.KEEP_ALIVE_DELAY,
        maxIdle: DB_CONFIG.MAX_IDLE,
        idleTimeout: DB_CONFIG.IDLE_TIMEOUT,
      });

      logger.info(`[Database] Connection pool created with limit: ${DB_CONFIG.CONNECTION_LIMIT}`);

      // Create Drizzle instance
      _db = drizzle(_pool);

      // Test connection
      await testConnection();
    } catch (error: unknown) {
      logger.error('[Database] Failed to connect:', error instanceof Error ? error.message : String(error));
      _db = null;
      _pool = null;
    }
  }

  return _db;
}

/**
 * Get the underlying MySQL connection pool
 * Use this for raw queries or transactions that need direct pool access
 * 
 * @returns MySQL connection pool or null
 */
export function getPool(): Pool | null {
  return _pool;
}

/**
 * Test database connection
 * Executes a simple query to verify connectivity
 * 
 * @throws Error if connection test fails
 */
export async function testConnection(): Promise<void> {
  if (!_pool) {
    throw new Error('[Database] Connection pool not initialized');
  }

  try {
    const connection = await _pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    logger.info('[Database] Connection test successful');
  } catch (error: unknown) {
    logger.error('[Database] Connection test failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Close database connections gracefully
 * Should be called during application shutdown
 */
export async function closeDbConnection(): Promise<void> {
  if (_pool) {
    try {
      await _pool.end();
      logger.info('[Database] Connection pool closed');
      _pool = null;
      _db = null;
    } catch (error: unknown) {
      logger.error('[Database] Error closing connection pool:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

/**
 * Get database connection statistics
 * Useful for monitoring and debugging
 * 
 * @returns Connection pool statistics
 */
export function getConnectionStats() {
  if (!_pool) {
    return {
      connected: false,
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      queuedRequests: 0,
    };
  }

  // Note: mysql2 pool doesn't expose all stats directly
  // This is a basic implementation
  return {
    connected: true,
    activeConnections: (_pool as any)._allConnections?.length ?? 0,
    idleConnections: (_pool as any)._freeConnections?.length ?? 0,
    totalConnections: (_pool as any)._allConnections?.length ?? 0,
    queuedRequests: (_pool as any)._connectionQueue?.length ?? 0,
  };
}

/**
 * Execute a function within a database transaction
 * Automatically commits on success, rolls back on error
 * 
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 * @throws Error if transaction fails
 * 
 * @example
 * ```ts
 * const result = await withTransaction(async (connection) => {
 *   await connection.query('INSERT INTO ...');
 *   await connection.query('UPDATE ...');
 *   return { success: true };
 * });
 * ```
 */
export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getPool();
  if (!pool) {
    throw new Error('[Database] Connection pool not available');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    logger.debug('[Database] Transaction started');

    const result = await callback(connection);

    await connection.commit();
    logger.debug('[Database] Transaction committed');

    return result;
  } catch (error: unknown) {
    await connection.rollback();
    logger.error('[Database] Transaction rolled back:', error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Check if database is connected and ready
 * 
 * @returns true if database is connected, false otherwise
 */
export function isConnected(): boolean {
  return _db !== null && _pool !== null;
}

/**
 * Require database connection
 * Throws error if database is not connected
 * 
 * @throws Error if database is not connected
 */
export async function requireDb(): Promise<DbInstance> {
  const db = await getDb();
  if (!db) {
    throw new Error('[Database] Database connection not available');
  }
  return db;
}

// Export type for use in other modules
export type { PoolConnection };
