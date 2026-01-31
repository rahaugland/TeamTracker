/**
 * Date utility functions
 * Centralized imports from date-fns for better tree-shaking
 * Import from this file instead of directly from date-fns
 */

import { format as formatDate } from 'date-fns/format';
import { formatDistanceToNow as distanceToNow } from 'date-fns/formatDistanceToNow';
import { parseISO as parseISODate } from 'date-fns/parseISO';

// Tree-shakeable exports from date-fns
export { formatDate as format, distanceToNow as formatDistanceToNow, parseISODate as parseISO };
export { isToday } from 'date-fns/isToday';
export { isTomorrow } from 'date-fns/isTomorrow';
export { isPast } from 'date-fns/isPast';
export { isFuture } from 'date-fns/isFuture';
export { isWithinInterval } from 'date-fns/isWithinInterval';
export { addDays } from 'date-fns/addDays';
export { addWeeks } from 'date-fns/addWeeks';
export { addMonths } from 'date-fns/addMonths';
export { startOfDay } from 'date-fns/startOfDay';
export { endOfDay } from 'date-fns/endOfDay';
export { startOfWeek } from 'date-fns/startOfWeek';
export { endOfWeek } from 'date-fns/endOfWeek';
export { startOfMonth } from 'date-fns/startOfMonth';
export { endOfMonth } from 'date-fns/endOfMonth';
export { differenceInDays } from 'date-fns/differenceInDays';
export { differenceInHours } from 'date-fns/differenceInHours';
export { differenceInMinutes } from 'date-fns/differenceInMinutes';

/**
 * Common date formatting helpers
 */

export function formatEventDate(dateString: string): string {
  return formatDate(parseISODate(dateString), 'MMM d, yyyy');
}

export function formatEventTime(dateString: string): string {
  return formatDate(parseISODate(dateString), 'h:mm a');
}

export function formatEventDateTime(dateString: string): string {
  return formatDate(parseISODate(dateString), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(dateString: string): string {
  return distanceToNow(parseISODate(dateString), { addSuffix: true });
}

/**
 * Datetime-local input helpers
 * These functions handle conversion between datetime-local inputs and database timestamps
 */

/**
 * Convert ISO string from database to datetime-local format for input
 * Example: "2024-01-25T17:00:00.000Z" (UTC) -> "2024-01-25T18:00" (local in UTC+1)
 */
export function formatDateTimeForInput(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local string to ISO string for database
 * Preserves the user's intended local time by converting to UTC
 * Example: "2024-01-25T18:00" (local in UTC+1) -> "2024-01-25T17:00:00.000Z" (UTC)
 */
export function formatDateTimeForDatabase(dateTimeLocalString: string): string {
  const date = new Date(dateTimeLocalString);
  return date.toISOString();
}
