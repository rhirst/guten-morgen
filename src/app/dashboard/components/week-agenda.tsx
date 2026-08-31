import { useMemo, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  eventOccupiesLocalDay,
  formatLocalDate,
  rollingWeekDays,
} from "@/lib/google-dates";
import type { CalendarEvent } from "@/services/google/calendar.types";
import { cn } from "@/lib/utils";

function formatEventTime(event: CalendarEvent) {
  if (event.allDay) {
    return "All day";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(event.start);
}

function formatEventRange(event: CalendarEvent) {
  if (event.allDay) {
    const startLabel = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(event.start);

    const lastDay = new Date(event.end);
    lastDay.setDate(lastDay.getDate() - 1);

    if (formatLocalDate(event.start) === formatLocalDate(lastDay)) {
      return `All day · ${startLabel}`;
    }

    const endLabel = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(lastDay);

    return `All day · ${startLabel} – ${endLabel}`;
  }

  const datePart = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(event.start);

  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart} · ${timePart.format(event.start)} – ${timePart.format(event.end)}`;
}

function sortDayEvents(a: CalendarEvent, b: CalendarEvent) {
  if (a.allDay !== b.allDay) {
    return a.allDay ? -1 : 1;
  }

  return a.start.getTime() - b.start.getTime();
}

export function WeekAgenda({
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
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const days = useMemo(() => rollingWeekDays(), []);
  const todayKey = formatLocalDate();

  const eventsByDay = useMemo(() => {
    return days.map((day) => ({
      day,
      events: events
        .filter((event) => eventOccupiesLocalDay(event, day))
        .sort(sortDayEvents),
    }));
  }, [days, events]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" />
            This week
          </CardTitle>
          <CardDescription>
            Rolling 7 days from today — click an event for details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthorized && (
            <p className="text-sm text-muted-foreground">
              Connect Google Calendar & Tasks to see your week.
            </p>
          )}
          {isAuthorized && loading && (
            <p className="text-sm text-muted-foreground">Loading events…</p>
          )}
          {isAuthorized && error && (
            <p className="text-sm text-destructive">{error.message}</p>
          )}
          {isAuthorized && !loading && !error && (
            <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-7 lg:overflow-visible">
              {eventsByDay.map(({ day, events: dayEvents }) => {
                const isToday = formatLocalDate(day) === todayKey;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex min-w-[140px] flex-col rounded-lg border p-2 lg:min-w-0",
                      isToday && "border-primary/40 bg-primary/5"
                    )}
                  >
                    <div className="mb-2 space-y-0.5 px-0.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {new Intl.DateTimeFormat(undefined, {
                          weekday: "short",
                        }).format(day)}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isToday && "text-primary"
                        )}
                      >
                        {new Intl.DateTimeFormat(undefined, {
                          month: "short",
                          day: "numeric",
                        }).format(day)}
                      </p>
                    </div>

                    <div className="flex min-h-24 flex-1 flex-col gap-1.5">
                      {dayEvents.length === 0 ? (
                        <p className="px-0.5 text-xs text-muted-foreground">
                          —
                        </p>
                      ) : (
                        dayEvents.map((event) => (
                          <button
                            key={`${event.calendarId}-${event.id}-${formatLocalDate(day)}`}
                            type="button"
                            onClick={() => setSelected(event)}
                            className="w-full rounded-md border bg-background px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span
                              className="mb-1 block h-1 w-full rounded-full"
                              style={{
                                backgroundColor:
                                  event.calendarColor ?? "var(--primary)",
                              }}
                            />
                            <span className="line-clamp-2 text-xs font-medium leading-snug">
                              {event.title}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-muted-foreground">
                              {formatEventTime(event)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      >
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {formatEventRange(selected)}
                  {selected.calendarName ? ` · ${selected.calendarName}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                {selected.location && (
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>{selected.location}</span>
                  </p>
                )}
                {selected.description && (
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {selected.description}
                  </p>
                )}
                {selected.htmlLink && (
                  <a
                    href={selected.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open in Google Calendar
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
