import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCtaBusPredictions,
  type CtaBusPredictions,
} from "@/services/ctaBus";

const POLL_INTERVAL_MS = 30_000;

export function useCtaBus() {
  const [predictions, setPredictions] = useState<CtaBusPredictions | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlightRef = useRef(false);

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
    const interval = window.setInterval(() => {
      void load(true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [load]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  return {
    predictions,
    loading,
    refreshing,
    error,
    refresh,
  };
}
