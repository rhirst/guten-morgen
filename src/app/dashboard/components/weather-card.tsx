import { CloudSun } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWeather } from "@/hooks/useWeather";

export function WeatherCard({
  temperatureUnit,
}: {
  temperatureUnit: string | undefined;
}) {
  const { weather, loading, error, permissionDenied } =
    useWeather(temperatureUnit);

  const unitLabel =
    weather?.unit === "fahrenheit" || temperatureUnit === "fahrenheit"
      ? "°F"
      : "°C";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudSun className="size-4" />
          Weather
        </CardTitle>
        <CardDescription>Current conditions {permissionDenied ? "near Chicago" : "near you"}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground">Loading weather…</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error.message}</p>
        )}
        {weather && !loading && (
          <div>
            <p className="text-3xl font-semibold tabular-nums">
              {Math.round(weather.temperature)}
              {unitLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              {weather.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
