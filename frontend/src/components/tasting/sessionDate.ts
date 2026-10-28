/**
 * Tasting session date helpers. The API sometimes returns bare datetimes without an offset;
 * those are UTC.
 */
import { format } from 'date-fns';

export type Meridiem = 'AM' | 'PM';

export const HOURS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
export const MINUTES = ['00', '15', '30', '45'];
const MINUTE_STEP = 15;

export interface TimeOfDay {
  hour: string;
  minute: string;
  period: Meridiem;
}

export function toUtcDate(dateString: string): Date {
  const hasOffset = dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString);
  return new Date(hasOffset ? dateString : dateString + 'Z');
}

/** "3 Nov 2026" */
export function formatShortDate(dateString: string): string {
  return toUtcDate(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "Tuesday, 3 November 2026" */
export function formatLongDate(dateString: string): string {
  return toUtcDate(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function isSessionExpired(dateString: string): boolean {
  const sessionDate = toUtcDate(dateString);
  const today = new Date();
  sessionDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return sessionDate < today;
}

/** A stored datetime as a local date plus a 12-hour time rounded to the quarter hour. */
export function parseDateTimeComponents(dateString: string): { date: Date } & TimeOfDay {
  const date = toUtcDate(dateString);
  let hour = date.getHours();
  const period: Meridiem = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  const roundedMinute = Math.round(date.getMinutes() / MINUTE_STEP) * MINUTE_STEP;
  return {
    date,
    hour: String(hour),
    minute: (roundedMinute === 60 ? 0 : roundedMinute).toString().padStart(2, '0'),
    period,
  };
}

export function formatTimeOfDay({ hour, minute, period }: TimeOfDay): string {
  return `${hour}:${minute} ${period}`;
}

function to24HourTime({ hour, minute, period }: TimeOfDay): string {
  let h = parseInt(hour);
  if (period === 'AM') {
    if (h === 12) h = 0;
  } else if (h !== 12) {
    h += 12;
  }
  return `${h.toString().padStart(2, '0')}:${minute}`;
}

/** The local date and time as an ISO string with the browser's UTC offset. */
export function toOffsetDateTimeString(date: Date, time: TimeOfDay): string {
  const dateStr = format(date, 'yyyy-MM-dd');
  const offset = date.getTimezoneOffset();
  const sign = offset <= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const offsetHours = Math.floor(absOffset / 60).toString().padStart(2, '0');
  const offsetMins = (absOffset % 60).toString().padStart(2, '0');
  return `${dateStr}T${to24HourTime(time)}:00${sign}${offsetHours}:${offsetMins}`;
}
