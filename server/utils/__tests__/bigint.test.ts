/**
 * BigInt Utility Tests
 * Tests safe BigInt to number conversion
 */

import { describe, it, expect } from 'vitest';
import { bigIntToNumber } from '../bigint';

describe('bigIntToNumber', () => {
  describe('Valid conversions', () => {
    it('should convert small BigInt to number', () => {
      const result = bigIntToNumber(BigInt(123));
      expect(result).toBe(123);
      expect(typeof result).toBe('number');
    });

    it('should convert large BigInt to number', () => {
      const result = bigIntToNumber(BigInt(999999999));
      expect(result).toBe(999999999);
      expect(typeof result).toBe('number');
    });

    it('should return number as-is', () => {
      const result = bigIntToNumber(456);
      expect(result).toBe(456);
      expect(typeof result).toBe('number');
    });

    it('should handle zero', () => {
      expect(bigIntToNumber(BigInt(0))).toBe(0);
      expect(bigIntToNumber(0)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(bigIntToNumber(BigInt(-123))).toBe(-123);
      expect(bigIntToNumber(-456)).toBe(-456);
    });

    it('should handle MAX_SAFE_INTEGER', () => {
      const maxSafe = Number.MAX_SAFE_INTEGER;
      const result = bigIntToNumber(BigInt(maxSafe));
      expect(result).toBe(maxSafe);
    });
  });

  describe('Error handling', () => {
    it('should throw error for BigInt exceeding MAX_SAFE_INTEGER', () => {
      const tooBig = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
      
      expect(() => bigIntToNumber(tooBig)).toThrow();
      expect(() => bigIntToNumber(tooBig)).toThrow(/exceeds MAX_SAFE_INTEGER/);
    });

    it('should throw error for very large BigInt', () => {
      const veryLarge = BigInt('9999999999999999999');
      
      expect(() => bigIntToNumber(veryLarge)).toThrow();
    });

    it('should include the BigInt value in error message', () => {
      const tooBig = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(100);
      
      try {
        bigIntToNumber(tooBig);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain(tooBig.toString());
        expect(error.message).toContain('MAX_SAFE_INTEGER');
      }
    });
  });

  describe('MySQL insertId scenarios', () => {
    it('should handle typical MySQL insertId', () => {
      // MySQL returns insertId as BigInt
      const insertId = BigInt(1234567);
      const result = bigIntToNumber(insertId);
      
      expect(result).toBe(1234567);
      expect(typeof result).toBe('number');
    });

    it('should handle auto-increment IDs up to millions', () => {
      const largeId = BigInt(9999999); // 10 million
      const result = bigIntToNumber(largeId);
      
      expect(result).toBe(9999999);
    });

    it('should handle sequential IDs', () => {
      const ids = [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)];
      const results = ids.map(bigIntToNumber);
      
      expect(results).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Edge cases', () => {
    it('should handle 1', () => {
      expect(bigIntToNumber(BigInt(1))).toBe(1);
      expect(bigIntToNumber(1)).toBe(1);
    });

    it('should handle -1', () => {
      expect(bigIntToNumber(BigInt(-1))).toBe(-1);
      expect(bigIntToNumber(-1)).toBe(-1);
    });

    it('should be idempotent for numbers', () => {
      const num = 12345;
      expect(bigIntToNumber(bigIntToNumber(num))).toBe(num);
    });
  });
});
