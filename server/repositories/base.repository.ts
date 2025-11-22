import { drizzle } from "drizzle-orm/mysql2";
import type { Pool } from "mysql2/promise";

/**
 * Base Repository Class
 * 
 * Provides common database access patterns and utilities
 * All domain repositories should extend this class
 */
export abstract class BaseRepository {
  protected db: ReturnType<typeof drizzle> | null = null;

  constructor(db: ReturnType<typeof drizzle> | null) {
    this.db = db;
  }

  /**
   * Check if database is available
   */
  protected isDatabaseAvailable(): boolean {
    return this.db !== null;
  }

  /**
   * Throw error if database is not available
   */
  protected ensureDatabaseAvailable(): void {
    if (!this.isDatabaseAvailable()) {
      throw new Error("Database is not available");
    }
  }

  /**
   * Log warning if database is not available
   */
  protected warnDatabaseUnavailable(operation: string): void {
    console.warn(`[${this.constructor.name}] Cannot ${operation}: database not available`);
  }
}
