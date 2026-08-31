/**
 * Google Tasks `due` is date-only: the API returns RFC3339 midnights like
 * `2026-08-30T00:00:00.000Z`, but only the calendar day matters.
 * Google Calendar all-day `end.date` is exclusive.
 */

/** Fixed hour when the task "day" rolls over in the configured timezone. */
export const TASK_DAY_RESET_HOUR = 4;

export const DEFAULT_TASK_DAY_TIMEZONE = "America/Chicago";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

/** Instant for a wall-clock date/time in an IANA timezone. */
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const actual = zonedParts(utcGuess, timeZone);
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const actualAsUtc = Date.UTC(
    actual.year,
    actual.month - 1,
    actual.day,
    actual.hour,
    actual.minute,
    actual.second
  );
  return new Date(utcGuess.getTime() + (desiredAsUtc - actualAsUtc));
}

/**
 * Most recent task-day reset (4:00 AM) in `timeZone`.
 * Before 4am, returns yesterday's 4am in that zone.
 */
export function getTaskDayBoundary(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TASK_DAY_TIMEZONE
): Date {
  const parts = zonedParts(now, timeZone);
  let { year, month, day } = parts;

  if (parts.hour < TASK_DAY_RESET_HOUR) {
    const previous = new Date(Date.UTC(year, month - 1, day));
    previous.setUTCDate(previous.getUTCDate() - 1);
    year = previous.getUTCFullYear();
    month = previous.getUTCMonth() + 1;
    day = previous.getUTCDate();
  }

  return zonedTimeToUtc(
    year,
    month,
    day,
    TASK_DAY_RESET_HOUR,
    0,
    0,
    timeZone
  );
}

/**
 * YYYY-MM-DD for the current task day (the calendar date of the 4am boundary
 * in the given timezone).
 */
export function getTaskCalendarDate(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TASK_DAY_TIMEZONE
): string {
  const boundary = getTaskDayBoundary(now, timeZone);
  const parts = zonedParts(boundary, timeZone);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

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
  // if it is the current day, return "Today"
  if (isSameDateString(dateOnly, formatLocalDate())) {
    return "Today";
  }
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
 * Rolling month: today through today+29 (30 local calendar days).
 */
export function rollingMonthDays(from: Date = new Date()): Date[] {
  const start = startOfLocalDay(from);
  return Array.from({ length: 30 }, (_, index) => addLocalDays(start, index));
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
