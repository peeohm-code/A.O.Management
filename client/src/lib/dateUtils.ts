/**
 * Date utility functions for consistent date handling across the app
 * 
 * Database stores dates as VARCHAR(10) in YYYY-MM-DD format
 * This utility ensures proper conversion between string and Date objects
 */

/**
 * Safely parse a date from string or Date object
 * @param date - Date string (YYYY-MM-DD), Date object, or undefined
 * @returns Valid Date object or current date as fallback
 */
export function parseDate(date: string | Date | undefined | null): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Format Date object to YYYY-MM-DD string for database storage
 * @param date - Date object or string
 * @returns YYYY-MM-DD formatted string
 */
export function formatDateForDB(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString().split('T')[0];
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  
  return dateObj.toISOString().split('T')[0];
}

/**
 * Format date for display in Thai locale
 * @param date - Date string or Date object
 * @param format - 'short' | 'long' | 'full'
 * @returns Formatted date string in Thai
 */
export function formatDateThai(
  date: string | Date | undefined | null,
  format: 'short' | 'long' | 'full' = 'short'
): string {
  const dateObj = parseDate(date);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    day: 'numeric',
  };
  
  if (format === 'full') {
    options.weekday = 'long';
  }
  
  return dateObj.toLocaleDateString('th-TH', options);
}

/**
 * Calculate days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days (can be negative if end is before start)
 */
export function daysBetween(
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null
): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate working days between two dates (excluding weekends)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of working days
 */
export function workingDaysBetween(
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null
): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns true if date is before today
 */
export function isPast(date: string | Date | undefined | null): boolean {
  const dateObj = parseDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dateObj < today;
}

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns true if date is today
 */
export function isToday(date: string | Date | undefined | null): boolean {
  const dateObj = parseDate(date);
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Get relative date string (e.g., "2 days ago", "in 3 days")
 * @param date - Date to compare
 * @returns Relative date string in Thai
 */
export function getRelativeDateThai(date: string | Date | undefined | null): string {
  const dateObj = parseDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const days = daysBetween(today, dateObj);
  
  if (days === 0) return 'วันนี้';
  if (days === 1) return 'พรุ่งนี้';
  if (days === -1) return 'เมื่อวาน';
  if (days > 0) return `อีก ${days} วัน`;
  return `${Math.abs(days)} วันที่แล้ว`;
}

/**
 * Validate date string format (YYYY-MM-DD)
 * @param dateString - Date string to validate
 * @returns true if valid format
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Get date range array between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of dates
 */
export function getDateRange(
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null
): Date[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  const dates: Date[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}
