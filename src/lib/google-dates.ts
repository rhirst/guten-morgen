/**
 * Google Tasks `due` is date-only: the API returns RFC3339 midnights like
 * `2026-08-30T00:00:00.000Z`, but only the calendar day matters.
 * Google Calendar all-day `end.date` is exclusive.
 */

/** Local calendar day as YYYY-MM-DD (avoids UTC shift from Date-only parsing). */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Extract YYYY-MM-DD from a Tasks `due` string; ignore time / Z. */
export function parseGoogleTaskDueDate(due: string): string {
  return due.slice(0, 10);
}

export function isSameDateString(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

/** Format a YYYY-MM-DD string for display without UTC day-shift. */
export function formatDateOnlyLabel(
  dateOnly: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
): string {
  const [year, month, day] = dateOnly.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, options).format(
    new Date(year, month - 1, day)
  );
}

/** Local midnight for a YYYY-MM-DD all-day date. */
export function localDateFromDateOnly(dateOnly: string): Date {
  const [year, month, day] = dateOnly.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfLocalDay(date: Date = new Date()): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Rolling week: today through today+6 (7 local calendar days).
 */
export function rollingWeekDays(from: Date = new Date()): Date[] {
  const start = startOfLocalDay(from);
  return Array.from({ length: 7 }, (_, index) => addLocalDays(start, index));
}

/**
 * Whether an event occupies a local calendar day.
 * All-day events use exclusive end (Google Calendar API).
 * Timed events use half-open [start, end) in local time, with a
 * same-instant fallback so zero-duration events still show.
 */
export function eventOccupiesLocalDay(event: {
  start: Date;
  end: Date;
  allDay: boolean;
}, day: Date): boolean {
  const dayStart = startOfLocalDay(day);
  const dayEnd = addLocalDays(dayStart, 1);

  if (event.allDay) {
    return event.start < dayEnd && event.end > dayStart;
  }

  if (event.end.getTime() === event.start.getTime()) {
    return event.start >= dayStart && event.start < dayEnd;
  }

  return event.start < dayEnd && event.end > dayStart;
}
