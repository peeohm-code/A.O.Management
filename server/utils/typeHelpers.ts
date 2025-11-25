/**
 * Type Helper Functions for MySQL TINYINT(1) ↔ Boolean Conversion
 * 
 * MySQL stores boolean as TINYINT(1) which returns as number (0 or 1)
 * These helpers ensure type safety when working with boolean fields
 */

/**
 * Convert boolean to MySQL TINYINT(1) number
 * @param value - Boolean value to convert
 * @returns 1 for true, 0 for false
 */
export function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Convert MySQL TINYINT(1) number to boolean
 * @param value - Number value from database (0 or 1)
 * @returns true for 1, false for 0
 */
export function intToBool(value: number): boolean {
  return value === 1;
}

/**
 * Convert boolean to MySQL TINYINT(1) number (nullable version)
 * @param value - Boolean value or null
 * @returns 1 for true, 0 for false, null for null
 */
export function boolToIntNullable(value: boolean | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return value ? 1 : 0;
}

/**
 * Convert MySQL TINYINT(1) number to boolean (nullable version)
 * @param value - Number value from database or null
 * @returns true for 1, false for 0, null for null
 */
export function intToBoolNullable(value: number | null | undefined): boolean | null {
  if (value === null || value === undefined) return null;
  return value === 1;
}

/**
 * Convert object with boolean fields to MySQL-compatible object with numbers
 * @param obj - Object with boolean fields
 * @param booleanFields - Array of field names that should be converted
 * @returns New object with converted fields
 */
export function boolFieldsToInt<T extends Record<string, any>>(
  obj: T,
  booleanFields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of booleanFields) {
    if (field in result && typeof result[field] === 'boolean') {
      (result[field] as any) = boolToInt(result[field] as boolean);
    }
  }
  return result;
}

/**
 * Convert object with number fields (from MySQL) to boolean fields
 * @param obj - Object with number fields from database
 * @param booleanFields - Array of field names that should be converted
 * @returns New object with converted fields
 */
export function intFieldsToBool<T extends Record<string, any>>(
  obj: T,
  booleanFields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of booleanFields) {
    if (field in result && typeof result[field] === 'number') {
      (result[field] as any) = intToBool(result[field] as number);
    }
  }
  return result;
}

/**
 * Type guard to check if value is a valid MySQL boolean (0 or 1)
 */
export function isMySQLBoolean(value: any): value is 0 | 1 {
  return value === 0 || value === 1;
}

/**
 * Normalize boolean value from various sources (MySQL, user input, etc.)
 * Handles: boolean, number (0/1), string ("true"/"false"/"0"/"1")
 */
export function normalizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1';
  }
  return false;
}

/**
 * Normalize boolean to MySQL TINYINT from various sources
 */
export function normalizeBooleanToInt(value: any): number {
  return boolToInt(normalizeBoolean(value));
}
