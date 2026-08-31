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
  const { weather, loading, error } =
    useWeather(temperatureUnit);

  const unitLabel =
    weather?.unit === "fahrenheit" || temperatureUnit === "fahrenheit"
      ? "°F"
      : "°C";

  return (
    <Card className="flex flex-row items-center justify-between">
      <CardHeader className="flex flex-col items-start justify-start w-full">
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudSun className="size-4" />
          Weather
        </CardTitle>
        <CardDescription>Current conditions</CardDescription>
      </CardHeader>
      <CardContent className="w-full">
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
