import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBrowserPosition,
  getWeather,
  type DailyForecast,
  type HourlyForecast,
  type CurrentWeather,
  type TemperatureUnit,
} from "@/services/weather";

const CHICAGO = { latitude: 41.8781, longitude: -87.6298 };
const POLL_INTERVAL_MS = 2 * 60 * 60 * 1000;

function normalizeUnit(value: string | undefined): TemperatureUnit {
  return value === "fahrenheit" ? "fahrenheit" : "celsius";
}

export function useWeather(temperatureUnit: string | undefined) {
  const unit = normalizeUnit(temperatureUnit);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const inFlightRef = useRef(false);
  const coordsRef = useRef(CHICAGO);

  const load = useCallback(
    async (isRefresh: boolean) => {
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
        const data = await getWeather(
          coordsRef.current.latitude,
          coordsRef.current.longitude,
          unit,
          { refresh: isRefresh }
        );
        setWeather(data.current);
        setDaily(data.daily);
        setHourly(data.hourly);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load weather")
        );
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [unit]
  );

  useEffect(() => {
    let mounted = true;

    setPermissionDenied(false);
    coordsRef.current = CHICAGO;

    getBrowserPosition()
      .then((position) => {
        if (!mounted) return;
        coordsRef.current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      })
      .catch((err) => {
        if (!mounted) return;
        const geoError = err as GeolocationPositionError;
        if (geoError?.code === 1) {
          setPermissionDenied(true);
        }
        coordsRef.current = CHICAGO;
      })
      .finally(() => {
        if (!mounted) return;
        void load(false);
      });

    return () => {
      mounted = false;
    };
  }, [load]);

  useEffect(() => {
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
    weather,
    daily,
    hourly,
    loading,
    refreshing,
    error,
    permissionDenied,
    refresh,
  };
}
