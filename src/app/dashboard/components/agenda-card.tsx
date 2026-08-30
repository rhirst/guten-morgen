import { CalendarDays, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CalendarEvent } from "@/services/google/calendar.types";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function isEventToday(event: CalendarEvent, now = new Date()) {
  return event.start <= endOfDay(now) && event.end >= startOfDay(now);
}

function formatEventTime(event: CalendarEvent) {
  if (event.allDay) {
    return "All day";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(event.start);
}

export function AgendaCard({
  events,
  loading,
  error,
  isAuthorized,
}: {
  events: CalendarEvent[];
  loading: boolean;
  error: Error | null;
  isAuthorized: boolean;
}) {
  const todaysEvents = events.filter((event) => isEventToday(event));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="size-4" />
          Today’s agenda
        </CardTitle>
        <CardDescription>Events from your Google calendars</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthorized && (
          <p className="text-sm text-muted-foreground">
            Connect Google Calendar & Tasks to see today’s events.
          </p>
        )}
        {isAuthorized && loading && (
          <p className="text-sm text-muted-foreground">Loading events…</p>
        )}
        {isAuthorized && error && (
          <p className="text-sm text-destructive">{error.message}</p>
        )}
        {isAuthorized && !loading && !error && todaysEvents.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No events on the calendar today.
          </p>
        )}
        {isAuthorized && !loading && todaysEvents.length > 0 && (
          <ul className="space-y-3">
            {todaysEvents.map((event) => (
              <li key={`${event.calendarId}-${event.id}`} className="flex gap-3">
                <span
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: event.calendarColor ?? "var(--primary)" }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventTime(event)}
                    {event.calendarName ? ` · ${event.calendarName}` : ""}
                  </p>
                  {event.location && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {event.location}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
