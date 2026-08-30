import { useEffect, useState } from "react";
import {
  getBrowserPosition,
  getCurrentWeather,
  type CurrentWeather,
  type TemperatureUnit,
} from "@/services/weather";

function normalizeUnit(value: string | undefined): TemperatureUnit {
  return value === "fahrenheit" ? "fahrenheit" : "celsius";
}

export function useWeather(temperatureUnit: string | undefined) {
  const unit = normalizeUnit(temperatureUnit);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setPermissionDenied(false);

    getBrowserPosition()
      .then((position) =>
        getCurrentWeather(
          position.coords.latitude,
          position.coords.longitude,
          unit
        )
      )
      .then((data) => {
        if (!mounted) return;
        setWeather(data);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;

        const geoError = err as GeolocationPositionError;
        if (geoError?.code === 1) {
          setPermissionDenied(true);
          setError(null);
        } else {
          setError(
            err instanceof Error ? err : new Error("Failed to load weather")
          );
        }
        getCurrentWeather(41.8781, -87.6298, unit).then((data) => {
          if (!mounted) return;
          setWeather(data);
          setError(null);
          setLoading(false);
        }).catch((err) => {
          if (!mounted) return;
          setError(
            err instanceof Error ? err : new Error("Failed to load weather")
          );
          setLoading(false);
        });
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [unit]);

  return {
    weather,
    loading,
    error,
    permissionDenied,
  };
}
