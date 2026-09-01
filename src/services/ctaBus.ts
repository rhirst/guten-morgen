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

export function formatArrivalCountdown(prdctdn: string): string {
  const value = prdctdn.trim().toUpperCase();
  if (!value || value === "DUE" || value === "0" || value === "1") {
    return "DUE";
  }
  if (value === "DLY") {
    return "Delayed";
  }
  return `${value} min`;
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
