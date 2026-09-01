import { useMemo, useState } from "react";
import { CloudSun, RefreshCw, CloudRainIcon, DropletIcon, Sun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, CloudRainWind } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useWeather } from "@/hooks/useWeather";
import {
  hoursForDate,
  type DailyForecast,
  type HourlyForecast,
} from "@/services/weather";
import { cn } from "@/lib/utils";

function unitSuffix(unit: string | undefined) {
  return unit === "fahrenheit" ? "°F" : "°C";
}

function parseLocalDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function parseLocalDateTime(isoDateTime: string) {
  const [datePart, timePart = "00:00"] = isoDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0);
}

function dayLabel(date: string, index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
    parseLocalDate(date)
  );
}

function dayTitle(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseLocalDate(date));
}

function formatHour(time: string, clockFormat: string) {
  const hour12 = clockFormat !== "24h" && clockFormat !== "24";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12,
  }).format(parseLocalDateTime(time));
}

function weatherIcon(code: number): React.ReactNode {
  switch (code) {
    case 0:
      return <Sun className="size-4" />;
    case 1:
    case 2:
      return <CloudSun className="size-4" />;
    case 3:
      return <Cloud className="size-4" />;
    case 45:
    case 48:
      return <CloudFog className="size-4" />;
    case 51:
    case 53:
    case 55:
      return <CloudDrizzle className="size-4" />;
    case 61:
    case 63:
    case 65:
      return <CloudRain className="size-4" />;
    case 71:
    case 73:
    case 75:
      return <CloudSnow className="size-4" />;
    case 80:
    case 81:
      return <CloudRain className="size-4" />;
    case 82:
      return <CloudRainWind className="size-4" />;
    case 85:
    case 86:
      return <CloudSnow className="size-4" />;
    case 95:
    case 96:
    case 99:
      return <CloudLightning className="size-4" />;
    default:
      return <Cloud className="size-4" />;
  }
}

export function WeatherCard({
  temperatureUnit,
  clockFormat = "12h",
}: {
  temperatureUnit: string | undefined;
  clockFormat?: string;
}) {
  const { weather, daily, hourly, loading, refreshing, error, refresh } =
    useWeather(temperatureUnit);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const busy = loading || refreshing;

  const unitLabel = unitSuffix(weather?.unit ?? temperatureUnit);
  const selectedDay = daily.find((day) => day.date === selectedDate) ?? null;
  const selectedHours = useMemo(
    () => (selectedDate ? hoursForDate(hourly, selectedDate) : []),
    [hourly, selectedDate]
  );

  function openDay(date: string) {
    setSelectedDate(date);
    refresh();
  }

  return (
    <>
      <Card className="py-2 max-w-full w-full">
        <CardContent className="flex flex-row gap-4 relative justify-between">
          <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 absolute -top-2 right-0"
              onClick={refresh}
              disabled={busy}
              aria-label="Refresh weather"
            >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </Button>
          {loading && !weather && (
            <p className="text-sm text-muted-foreground">Loading weather…</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error.message}</p>
          )}
          {weather && (
            <>
              <div className="flex flex-col items-start justify-center">
                <span className="text-sm">Current</span>
                <div className="flex gap-1 flex-col">
                  <p className="text-3xl font-semibold tabular-nums">
                    {Math.round(weather.temperature)}
                    {unitLabel}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {weatherIcon(weather.weatherCode)}
                    {weather.description}
                  </p>
                </div>
              </div>
              {daily.length > 0 && (
                <div className="grid grid-cols-3 gap-1">
                  {daily.map((day, index) => (
                    <DayButton
                      key={day.date}
                      day={day}
                      index={index}
                      unitLabel={unitLabel}
                      onSelect={openDay}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Drawer
        open={selectedDate !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null);
        }}
        direction="right"
      >
        <DrawerContent className="h-full">
          <DrawerHeader>
            <DrawerTitle>
              {selectedDay ? dayTitle(selectedDay.date) : "Hourly forecast"}
            </DrawerTitle>
            <DrawerDescription className="flex items-center gap-1.5">
              {selectedDay ? (
                <>
                  {Math.round(selectedDay.high)}
                  {unitLabel} / {Math.round(selectedDay.low)}
                  {unitLabel} · {weatherIcon(selectedDay.weatherCode)}
                  {selectedDay.description}
                </>
              ) : (
                "Hourly temperatures for the selected day"
              )}
            </DrawerDescription>
          </DrawerHeader>
          <HourlyList
            hours={selectedHours}
            unitLabel={unitLabel}
            clockFormat={clockFormat}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}

function DayButton({
  day,
  index,
  unitLabel,
  onSelect,
}: {
  day: DailyForecast;
  index: number;
  unitLabel: string;
  onSelect: (date: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      className="hover:bg-muted/60 focus-visible:ring-ring rounded-md px-2 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <p className="text-xs font-medium">{dayLabel(day.date, index)}</p>
      <p className="text-sm font-semibold tabular-nums">
        {Math.round(day.high)}
        {unitLabel}
        <span className="text-muted-foreground font-normal">
          {" "}
          / {Math.round(day.low)}
          {unitLabel}
        </span>
      </p>
      <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
        {weatherIcon(day.weatherCode)}
        {day.description}
      </p>
    </button>
  );
}

function HourlyList({
  hours,
  unitLabel,
  clockFormat,
}: {
  hours: HourlyForecast[];
  unitLabel: string;
  clockFormat: string;
}) {
  if (hours.length === 0) {
    return (
      <p className="text-muted-foreground px-4 pb-6 text-sm">
        No hourly forecast for this day.
      </p>
    );
  }

  return (
    <ul className="overflow-y-auto px-4 pb-6">
      <li className="flex items-baseline justify-between gap-3 border-b py-2 last:border-b-0">
        <span className="text-muted-foreground w-20 shrink-0 text-sm tabular-nums">Time</span>
        <span className="min-w-0 flex-1 truncate text-sm">Description</span>
        <span className="text-muted-foreground w-10 shrink-0 text-right text-sm tabular-nums"><CloudRainIcon className="size-4" /></span>
        <span className="shrink-0 text-sm font-semibold tabular-nums">{unitLabel}</span>
      </li>
      {hours.map((hour) => (
        <li
          key={hour.time}
          className="flex items-baseline justify-between gap-3 border-b py-2 last:border-b-0"
        >
          <span className="text-muted-foreground w-20 shrink-0 text-sm tabular-nums">
            {formatHour(hour.time, clockFormat)}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm">
            {weatherIcon(hour.weatherCode)}
            {hour.description}
          </span>
          <span className="text-muted-foreground w-10 shrink-0 text-right text-sm tabular-nums">
            {Math.round(hour.precipitationProbability)}%
          </span>
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {Math.round(hour.temperature)}
            {unitLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}
