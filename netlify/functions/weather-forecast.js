const CHICAGO = { latitude: 41.8781, longitude: -87.6298 };

const WEATHER_DESCRIPTIONS = {
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

export const config = {
  schedule: "0 */2 * * *",
};

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function describeWeatherCode(code) {
  return WEATHER_DESCRIPTIONS[code] ?? "Weather";
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapSnapshot(data, unit) {
  const weatherCode = data.current?.weather_code ?? 0;
  const dailyTimes = data.daily?.time ?? [];
  const hourlyTimes = data.hourly?.time ?? [];

  return {
    current: {
      temperature: data.current?.temperature_2m ?? 0,
      unit,
      weatherCode,
      description: describeWeatherCode(weatherCode),
    },
    daily: dailyTimes.map((date, index) => {
      const code = data.daily?.weather_code?.[index] ?? 0;
      return {
        date,
        high: data.daily?.temperature_2m_max?.[index] ?? 0,
        low: data.daily?.temperature_2m_min?.[index] ?? 0,
        weatherCode: code,
        description: describeWeatherCode(code),
      };
    }),
    hourly: hourlyTimes.map((time, index) => {
      const code = data.hourly?.weather_code?.[index] ?? 0;
      return {
        time,
        temperature: data.hourly?.temperature_2m?.[index] ?? 0,
        weatherCode: code,
        description: describeWeatherCode(code),
        precipitationProbability:
          data.hourly?.precipitation_probability?.[index] ?? 0,
      };
    }),
  };
}

export const handler = async (event) => {
  const httpMethod = event?.httpMethod ?? "GET";
  if (httpMethod !== "GET") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const params = event?.queryStringParameters ?? {};
  const refresh = params.refresh === "1" || params.refresh === "true";
  const unit = params.unit === "fahrenheit" ? "fahrenheit" : "celsius";
  const latitude = parseNumber(params.latitude, CHICAGO.latitude);
  const longitude = parseNumber(params.longitude, CHICAGO.longitude);

  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,weather_code",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    temperature_unit: unit,
    forecast_days: "3",
    timezone: "auto",
  });

  let data;
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${query}`
    );
    if (!response.ok) {
      return jsonResponse(502, {
        error: "weather_unavailable",
        message: "Weather forecast request failed",
      });
    }
    data = await response.json();
  } catch {
    return jsonResponse(502, {
      error: "weather_unavailable",
      message: "Weather forecast request failed",
    });
  }

  return jsonResponse(
    200,
    mapSnapshot(data, unit),
    refresh
      ? { "Cache-Control": "no-store" }
      : { "Cache-Control": "public, max-age=7200" }
  );
};
