import { useCallback, useEffect, useMemo, useState } from "react";

import { getCalendars, getEvents } from "@/services/google/calendar";
import type {
  CalendarEvent,
  GoogleCalendar,
} from "@/services/google/calendar.types";
import { useGoogleAuth } from "@/providers/GoogleAuthProvider";
import {
  filterByEnabledIds,
  isSourceEnabled,
} from "@/services/settings";

export function useCalendar(enabledCalendarIds?: string[] | null) {
  const { isAuthorized } = useGoogleAuth();

  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthorized) {
      setCalendars([]);
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const calendarList = await getCalendars();

      setCalendars(calendarList);

      const visibleCalendars = filterByEnabledIds(
        calendarList,
        enabledCalendarIds
      );

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const eventArrays = await Promise.all(
        visibleCalendars.map((calendar) => getEvents(calendar, start, end))
      );

      setEvents(
        eventArrays
          .flat()
          .sort((a, b) => a.start.getTime() - b.start.getTime())
      );
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load calendar")
      );
    } finally {
      setLoading(false);
    }
  }, [enabledCalendarIds, isAuthorized]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visibleCalendars = useMemo(
    () =>
      calendars.filter((calendar) =>
        isSourceEnabled(calendar.id, enabledCalendarIds)
      ),
    [calendars, enabledCalendarIds]
  );

  return {
    calendars,
    visibleCalendars,
    events,
    loading,
    error,
    refresh,
  };
}
