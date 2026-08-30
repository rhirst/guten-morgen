export type TemperatureUnit = "celsius" | "fahrenheit";

export type CurrentWeather = {
  temperature: number;
  unit: TemperatureUnit;
  weatherCode: number;
  description: string;
};

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Icy fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

export function describeWeatherCode(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? "Weather";
}

export async function getCurrentWeather(
  latitude: number,
  longitude: number,
  unit: TemperatureUnit
): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code",
    temperature_unit: unit,
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );

  if (!response.ok) {
    throw new Error("Failed to load weather");
  }

  const data = (await response.json()) as {
    current?: {
      temperature_2m?: number;
      weather_code?: number;
    };
  };

  const weatherCode = data.current?.weather_code ?? 0;

  return {
    temperature: data.current?.temperature_2m ?? 0,
    unit,
    weatherCode,
    description: describeWeatherCode(weatherCode),
  };
}

export function getBrowserPosition(): Promise<GeolocationPosition> {
  // default to chicago
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
