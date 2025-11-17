import { formatDistanceToNow, format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { th } from 'date-fns/locale';

/**
 * Format date to relative time (e.g., "2 ชม. ที่แล้ว", "เมื่อวาน")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'ไม่ระบุ';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const minutesDiff = differenceInMinutes(now, dateObj);
  const hoursDiff = differenceInHours(now, dateObj);
  const daysDiff = differenceInDays(now, dateObj);
  
  // Less than 1 hour
  if (minutesDiff < 60) {
    if (minutesDiff < 1) return 'เมื่อสักครู่';
    return `${minutesDiff} นาทีที่แล้ว`;
  }
  
  // Less than 24 hours
  if (hoursDiff < 24) {
    return `${hoursDiff} ชม. ที่แล้ว`;
  }
  
  // Yesterday
  if (daysDiff === 1) {
    return 'เมื่อวาน';
  }
  
  // Less than 7 days
  if (daysDiff < 7) {
    return `${daysDiff} วันที่แล้ว`;
  }
  
  // More than 7 days - show short date
  return formatShortDate(dateObj);
}

/**
 * Format date to short format (e.g., "15 ต.ค." or "15 ต.ค. 68")
 */
export function formatShortDate(date: Date | string | null | undefined, includeYear = false): string {
  if (!date) return 'ไม่ระบุ';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (includeYear) {
    return format(dateObj, 'd MMM yy', { locale: th });
  }
  
  return format(dateObj, 'd MMM', { locale: th });
}

/**
 * Format date to short format with year (e.g., "15 ต.ค. 2568")
 */
export function formatShortDateWithYear(date: Date | string | null | undefined): string {
  if (!date) return 'ไม่ระบุ';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'd MMM yyyy', { locale: th });
}

/**
 * Format date range (e.g., "15-20 ต.ค." or "15 ต.ค. - 5 พ.ย.")
 */
export function formatDateRange(startDate: Date | string | null | undefined, endDate: Date | string | null | undefined): string {
  if (!startDate || !endDate) return 'ไม่ระบุ';
  
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const startMonth = format(start, 'MMM', { locale: th });
  const endMonth = format(end, 'MMM', { locale: th });
  
  // Same month
  if (startMonth === endMonth) {
    return `${format(start, 'd', { locale: th })}-${format(end, 'd MMM', { locale: th })}`;
  }
  
  // Different months
  return `${format(start, 'd MMM', { locale: th })} - ${format(end, 'd MMM', { locale: th })}`;
}
