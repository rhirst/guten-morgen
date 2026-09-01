export type TemperatureUnit = "celsius" | "fahrenheit";

export type CurrentWeather = {
  temperature: number;
  unit: TemperatureUnit;
  weatherCode: number;
  description: string;
};

export type DailyForecast = {
  date: string;
  high: number;
  low: number;
  weatherCode: number;
  description: string;
};

export type HourlyForecast = {
  time: string;
  temperature: number;
  weatherCode: number;
  description: string;
  precipitationProbability: number;
};

export type WeatherSnapshot = {
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
};

export function hoursForDate(
  hourly: HourlyForecast[],
  date: string
): HourlyForecast[] {
  return hourly.filter((hour) => hour.time.startsWith(date));
}

export function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 15 * 60 * 1000,
    });
  });
}

export async function getWeather(
  latitude: number,
  longitude: number,
  unit: TemperatureUnit,
  options?: { refresh?: boolean }
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    unit,
  });
  if (options?.refresh) {
    params.set("refresh", "1");
  }

  const response = await fetch(
    `/.netlify/functions/weather-forecast?${params}`
  );
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "Weather endpoint returned HTML instead of JSON. Run the app with `npm run dev:netlify` so Netlify functions are available."
    );
  }

  const data = (await response.json()) as
    | WeatherSnapshot
    | { error?: string; message?: string };

  if (!response.ok) {
    const message =
      "message" in data && data.message
        ? data.message
        : "Failed to load weather";
    throw new Error(message);
  }

  if (
    !("current" in data) ||
    !data.current ||
    !Array.isArray(data.daily) ||
    !Array.isArray(data.hourly)
  ) {
    throw new Error("Failed to load weather");
  }

  return {
    current: data.current,
    daily: data.daily,
    hourly: data.hourly.map((hour) => ({
      ...hour,
      precipitationProbability: hour.precipitationProbability ?? 0,
    })),
  };
}
