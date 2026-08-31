import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  eventOccupiesLocalDay,
  formatLocalDate,
  rollingMonthDays,
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

function scrollStripBy(el: HTMLElement, delta: number) {
  if (typeof el.scrollBy === "function") {
    try {
      el.scrollBy({ left: delta, behavior: "smooth" });
      return;
    } catch {
      // Older browsers may reject the options object.
    }

    try {
      el.scrollBy(delta, 0);
      return;
    } catch {
      // Fall through to scrollLeft.
    }
  }

  el.scrollLeft += delta;
}

export function WeekAgenda({
  events,
  loading,
  error,
  isAuthorized,
  className,
}: {
  events: CalendarEvent[];
  loading: boolean;
  error: Error | null;
  isAuthorized: boolean;
  className?: string;
}) {
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => rollingMonthDays(), []);
  const todayKey = formatLocalDate();

  const eventsByDay = useMemo(() => {
    return days.map((day) => ({
      day,
      events: events
        .filter((event) => eventOccupiesLocalDay(event, day))
        .sort(sortDayEvents),
    }));
  }, [days, events]);

  const updateScrollState = useCallback(() => {
    const el = stripRef.current;
    if (!el) {
      return;
    }

    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollPrev(el.scrollLeft > 1);
    setCanScrollNext(el.scrollLeft < maxScroll - 1);
  }, []);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) {
      return;
    }

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateScrollState)
        : null;
    resizeObserver?.observe(el);

    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, eventsByDay.length, isAuthorized, loading, error]);

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const el = stripRef.current;
      if (!el) {
        return;
      }

      scrollStripBy(el, direction * el.clientWidth);
    },
    []
  );

  const handleStripKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollByPage(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollByPage(1);
      }
    },
    [scrollByPage]
  );

  return (
    <>
      <Card className={cn("flex min-h-0 flex-col", className)}>
        <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4" />
              Upcoming
            </CardTitle>
            <CardDescription>
              Next 30 days — swipe or use arrows to browse
            </CardDescription>
          </div>
          {isAuthorized && !loading && !error && (
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Previous days"
                disabled={!canScrollPrev}
                onClick={() => scrollByPage(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Next days"
                disabled={!canScrollNext}
                onClick={() => scrollByPage(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="min-h-0 overflow-y-auto">
          {!isAuthorized && (
            <p className="text-sm text-muted-foreground">
              Connect Google Calendar & Tasks to see your upcoming events.
            </p>
          )}
          {isAuthorized && loading && (
            <p className="text-sm text-muted-foreground">Loading events…</p>
          )}
          {isAuthorized && error && (
            <p className="text-sm text-destructive">{error.message}</p>
          )}
          {isAuthorized && !loading && !error && (
            <div
              ref={stripRef}
              tabIndex={0}
              role="region"
              aria-label="Upcoming calendar days"
              onKeyDown={handleStripKeyDown}
              className={cn(
                "flex gap-2 overflow-x-auto pb-1",
                "snap-x snap-mandatory scroll-smooth",
                "[-webkit-overflow-scrolling:touch]",
                "[scrollbar-width:thin]"
              )}
            >
              {eventsByDay.map(({ day, events: dayEvents }) => {
                const isToday = formatLocalDate(day) === todayKey;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex w-[calc((75%-2rem)/5)] shrink-0 snap-start flex-col rounded-lg border p-2",
                      "xl:w-[calc((100%-3rem)/7)]",
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

                    <div className="flex min-h-20 flex-1 flex-col gap-1.5">
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
