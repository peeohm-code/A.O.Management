/**
 * BigInt Utility Functions
 * Safe conversion between BigInt and number types
 */

/**
 * Safely convert BigInt to number
 * Throws error if value exceeds MAX_SAFE_INTEGER
 * 
 * @param value - BigInt or number value
 * @returns number value
 * @throws Error if BigInt exceeds MAX_SAFE_INTEGER
 * 
 * @example
 * const id = bigIntToNumber(result.insertId); // Safe conversion
 */
export function bigIntToNumber(value: bigint | number): number {
  // If already a number, return as-is
  if (typeof value === 'number') {
    return value;
  }

  // Convert BigInt to number
  const num = Number(value);

  // Validate that conversion didn't lose precision
  if (num > Number.MAX_SAFE_INTEGER) {
    throw new Error(
      `BigInt value ${value} exceeds MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER}). ` +
      `This may indicate a data integrity issue or the need to use BigInt throughout the application.`
    );
  }

  if (num < Number.MIN_SAFE_INTEGER) {
    throw new Error(
      `BigInt value ${value} is below MIN_SAFE_INTEGER (${Number.MIN_SAFE_INTEGER}). ` +
      `This may indicate a data integrity issue.`
    );
  }

  return num;
}

/**
 * Safely convert array of BigInt IDs to numbers
 * 
 * @param values - Array of BigInt or number values
 * @returns Array of number values
 * 
 * @example
 * const ids = bigIntArrayToNumbers(results.map(r => r.insertId));
 */
export function bigIntArrayToNumbers(values: (bigint | number)[]): number[] {
  return values.map(bigIntToNumber);
}

/**
 * Check if a value is a BigInt
 * 
 * @param value - Value to check
 * @returns true if value is BigInt
 */
export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

/**
 * Safely convert BigInt to string for JSON serialization
 * 
 * @param value - BigInt or number value
 * @returns string representation
 */
export function bigIntToString(value: bigint | number): string {
  return String(value);
}
