import { googleFetch } from "./googleApi";
import type {
  CalendarEvent,
  GoogleCalendar,
  GoogleCalendarListResponse,
  GoogleEventsResponse,
} from "./calendar.types";

const CALENDAR_API =
  "https://www.googleapis.com/calendar/v3";

export async function getCalendars(): Promise<GoogleCalendar[]> {
  const response = await googleFetch<GoogleCalendarListResponse>(
    `${CALENDAR_API}/users/me/calendarList`
  );

  return response.items ?? [];
}

function normalizeEvent(
    event: NonNullable<GoogleEventsResponse["items"]>[number],
    calendar: GoogleCalendar
  ): CalendarEvent {
  const allDay = Boolean(event.start.date);

  const start = allDay
    ? new Date(`${event.start.date}T00:00:00`)
    : new Date(event.start.dateTime!);

  const end = allDay
    ? new Date(`${event.end.date}T00:00:00`)
    : new Date(event.end.dateTime!);

  return {
    id: event.id,
    calendarId: calendar.id,
    calendarName: calendar.summary,

    title: event.summary ?? "(No title)",
    description: event.description,
    location: event.location,

    start,
    end,

    allDay,

    calendarColor: calendar.backgroundColor,
  };
}

export async function getEvents(
  calendar: GoogleCalendar,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const response = await googleFetch<GoogleEventsResponse>(
    `${CALENDAR_API}/calendars/${encodeURIComponent(
      calendar.id
    )}/events?${params}`
  );

  return (response.items ?? [])
    .filter((event) => event.status !== "cancelled")
    .map((event) => normalizeEvent(event, calendar));
}