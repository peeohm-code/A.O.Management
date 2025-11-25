/**
 * Pagination Constants
 * Centralized pagination defaults to ensure consistency
 */

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginationResult = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
};

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationResult {
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    currentPage: page,
    pageSize,
    totalItems,
    totalPages,
    hasMore: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * Calculate offset for database queries
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
