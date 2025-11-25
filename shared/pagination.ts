import { z } from "zod";

/**
 * Pagination Types และ Utilities
 * ใช้สำหรับจัดการ pagination ใน tRPC procedures
 */

// Pagination Input Schema
export const paginationInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export type PaginationInput = z.infer<typeof paginationInputSchema>;

// Pagination Result Type
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

/**
 * สร้าง pagination result object
 */
export function createPaginatedResult<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    items,
    pagination: {
      currentPage: page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

/**
 * คำนวณ offset สำหรับ SQL query
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: number, pageSize: number): void {
  if (page < 1) {
    throw new Error("Page must be greater than 0");
  }
  if (pageSize < 1 || pageSize > 100) {
    throw new Error("Page size must be between 1 and 100");
  }
}

// Infinite Scroll Input Schema
export const infiniteScrollInputSchema = z.object({
  cursor: z.number().int().optional(), // Last item ID
  limit: z.number().int().min(1).max(100).default(25),
});

export type InfiniteScrollInput = z.infer<typeof infiniteScrollInputSchema>;

// Infinite Scroll Result Type
export interface InfiniteScrollResult<T> {
  items: T[];
  nextCursor: number | null;
  hasMore: boolean;
}

/**
 * สร้าง infinite scroll result object
 */
export function createInfiniteScrollResult<T extends { id: number }>(
  items: T[],
  limit: number
): InfiniteScrollResult<T> {
  const hasMore = items.length === limit;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}
