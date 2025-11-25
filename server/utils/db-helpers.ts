/**
 * Database Helper Utilities
 * Safe type conversions and common database operations
 */

/**
 * Safely convert MySQL BigInt or string ID to JavaScript number
 * 
 * MySQL's insertId returns BigInt, which needs to be converted to number
 * for use in TypeScript. This utility handles the conversion safely.
 * 
 * @param value - The value to convert (can be bigint, string, number, or undefined)
 * @returns number or undefined if conversion fails
 * 
 * @example
 * ```ts
 * const result = await db.insert(users).values({...});
 * const userId = toNumber(result.insertId); // Safe conversion
 * ```
 */
export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  // Handle bigint
  if (typeof value === 'bigint') {
    // Check for safe integer range
    if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
      console.warn(`[DB Helper] BigInt value ${value} exceeds safe integer range`);
    }
    return Number(value);
  }

  // Handle string
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      console.warn(`[DB Helper] Failed to parse string "${value}" to number`);
      return undefined;
    }
    return parsed;
  }

  // Handle number
  if (typeof value === 'number') {
    return value;
  }

  // Handle objects with insertId property (Drizzle ORM result)
  if (typeof value === 'object' && value !== null && 'insertId' in value) {
    return toNumber((value as { insertId: unknown }).insertId);
  }

  console.warn(`[DB Helper] Unexpected value type for toNumber: ${typeof value}`);
  return undefined;
}

/**
 * Safely convert an array of values to numbers
 * Filters out undefined values
 * 
 * @param values - Array of values to convert
 * @returns Array of numbers (undefined values are filtered out)
 */
export function toNumberArray(values: unknown[]): number[] {
  return values
    .map(toNumber)
    .filter((v): v is number => v !== undefined);
}

/**
 * Extract insertId from Drizzle ORM insert result
 * 
 * @param result - Drizzle ORM insert result
 * @returns The inserted ID as a number
 * @throws Error if insertId is not found or invalid
 */
export function extractInsertId(result: unknown): number {
  if (!result || typeof result !== 'object') {
    throw new Error('[DB Helper] Invalid insert result: not an object');
  }

  if (!('insertId' in result)) {
    throw new Error('[DB Helper] Invalid insert result: missing insertId');
  }

  const id = toNumber((result as { insertId: unknown }).insertId);
  
  if (id === undefined) {
    throw new Error('[DB Helper] Failed to extract insertId from result');
  }

  return id;
}

/**
 * Extract insertId from array of Drizzle ORM results
 * Useful for batch inserts
 * 
 * @param results - Array of Drizzle ORM insert results
 * @returns Array of inserted IDs
 */
export function extractInsertIds(results: unknown[]): number[] {
  return results.map(extractInsertId);
}

/**
 * Safely parse count result from SQL query
 * Handles both number and string results
 * 
 * @param countResult - Result from COUNT(*) query
 * @returns The count as a number, or 0 if parsing fails
 */
export function parseCount(countResult: unknown): number {
  if (countResult === null || countResult === undefined) {
    return 0;
  }

  const num = toNumber(countResult);
  return num ?? 0;
}

/**
 * Clamp a number between min and max values
 * 
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round a number to specified decimal places
 * 
 * @param value - The value to round
 * @param decimals - Number of decimal places (default: 0)
 * @returns Rounded value
 */
export function roundTo(value: number, decimals: number = 0): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Check if a value is a valid positive integer ID
 * 
 * @param value - The value to check
 * @returns true if valid ID, false otherwise
 */
export function isValidId(value: unknown): value is number {
  const num = toNumber(value);
  return num !== undefined && num > 0 && Number.isInteger(num);
}

/**
 * Validate and convert ID, throw error if invalid
 * 
 * @param value - The value to validate
 * @param fieldName - Name of the field (for error message)
 * @returns Valid ID as number
 * @throws Error if ID is invalid
 */
export function requireValidId(value: unknown, fieldName: string = 'id'): number {
  if (!isValidId(value)) {
    throw new Error(`Invalid ${fieldName}: must be a positive integer`);
  }
  return value;
}
