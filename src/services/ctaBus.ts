export type CtaBusArrival = {
  prdctdn: string;
  prdtm: string;
  des: string;
  dly: boolean;
  dyn: number;
};

export type CtaBusRoute = {
  rt: string;
  rtdir: string;
  stpid: string;
  stpnm: string;
  arrivals: CtaBusArrival[];
};

export type CtaBusPredictions = {
  routes: CtaBusRoute[];
};

const CHICAGO_TIME_ZONE = "America/Chicago";

export function isChicagoDaytimePollWindow(date: Date = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CHICAGO_TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(date)
  );
  return hour >= 8 && hour < 22;
}

export function formatArrivalCountdown(
  prdctdn: string,
  lastFetchedAt?: number,
  now: number = Date.now()
): string {
  const value = prdctdn.trim().toUpperCase();
  if (!value || value === "DUE") {
    return "DUE";
  }
  if (value === "DLY") {
    return "Delayed";
  }

  const reportedMinutes = Number(value);
  if (!Number.isFinite(reportedMinutes)) {
    return `${value} min`;
  }

  const elapsedMinutes =
    lastFetchedAt === undefined
      ? 0
      : Math.max(0, Math.floor((now - lastFetchedAt) / 60_000));
  const remainingMinutes = Math.max(0, reportedMinutes - elapsedMinutes);

  if (remainingMinutes <= 1) {
    return "DUE";
  }

  return `${remainingMinutes} min`;
}

export async function getCtaBusPredictions(): Promise<CtaBusPredictions> {
  const response = await fetch("/.netlify/functions/cta-bus-predictions");
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "Bus times endpoint returned HTML instead of JSON. Run the app with `npm run dev:netlify` so Netlify functions are available."
    );
  }

  const data = (await response.json()) as
    | CtaBusPredictions
    | { error?: string; message?: string };

  if (!response.ok) {
    const message =
      "message" in data && data.message
        ? data.message
        : "Failed to load bus times";
    throw new Error(message);
  }

  if (!("routes" in data) || !Array.isArray(data.routes)) {
    throw new Error("Failed to load bus times");
  }

  return data;
}
