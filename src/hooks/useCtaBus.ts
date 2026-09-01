import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCtaBusPredictions,
  isChicagoDaytimePollWindow,
  type CtaBusPredictions,
} from "@/services/ctaBus";

export const DEFAULT_POLL_MS = 5 * 60 * 1000;
export const LIVE_POLL_MS = 30_000;
const LIVE_DURATION_MS = 20 * 60 * 1000;

export function useCtaBus() {
  const [predictions, setPredictions] = useState<CtaBusPredictions | null>(
    null
  );
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [nextFetchAt, setNextFetchAt] = useState<number | null>(null);
  const [liveUntil, setLiveUntil] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlightRef = useRef(false);

  const live = liveUntil !== null && liveUntil > Date.now();

  const load = useCallback(async (isRefresh: boolean) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getCtaBusPredictions();
      setPredictions(data);
      setLastFetchedAt(Date.now());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load bus times"));
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    if (liveUntil === null) {
      return;
    }

    const remaining = liveUntil - Date.now();
    if (remaining <= 0) {
      setLiveUntil(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      setLiveUntil(null);
    }, remaining);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [liveUntil]);

  useEffect(() => {
    const intervalMs = live ? LIVE_POLL_MS : DEFAULT_POLL_MS;
    const pollingActive = live || isChicagoDaytimePollWindow();

    if (pollingActive) {
      setNextFetchAt(Date.now() + intervalMs);
    } else {
      setNextFetchAt(null);
    }

    const interval = window.setInterval(() => {
      if (live || isChicagoDaytimePollWindow()) {
        void load(true);
        setNextFetchAt(Date.now() + intervalMs);
      } else {
        setNextFetchAt(null);
      }
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [live, load]);

  const refresh = useCallback(() => {
    setLiveUntil(Date.now() + LIVE_DURATION_MS);
    void load(true);
  }, [load]);

  const stopLive = useCallback(() => {
    setLiveUntil(null);
  }, []);

  return {
    predictions,
    lastFetchedAt,
    nextFetchAt,
    live,
    loading,
    refreshing,
    error,
    refresh,
    stopLive,
  };
}
