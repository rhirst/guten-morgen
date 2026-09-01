const CTA_PREDICTIONS_URL =
  "https://www.ctabustracker.com/bustime/api/v3/getpredictions";

const TRACKED_ROUTES = [
  {
    rt: "80",
    stpid: "5627",
    rtdir: "Eastbound",
    stpnm: "Irving Park & Leclaire",
  },
  {
    rt: "56",
    stpid: "5444",
    rtdir: "Southbound",
    stpnm: "Milwaukee & Kilpatrick/Byron",
  },
];

const HIDDEN_DYN = new Set([1, 4, 12, 16]);
const MAX_ARRIVALS = 3;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function asArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function isHiddenPrediction(prediction) {
  const dyn = Number(prediction?.dyn ?? 0);
  return HIDDEN_DYN.has(dyn);
}

function mapArrival(prediction) {
  return {
    prdctdn: String(prediction.prdctdn ?? ""),
    prdtm: String(prediction.prdtm ?? ""),
    des: String(prediction.des ?? ""),
    dly: Boolean(prediction.dly),
    dyn: Number(prediction.dyn ?? 0),
  };
}

function groupRoutes(predictions) {
  return TRACKED_ROUTES.map((route) => {
    const arrivals = predictions
      .filter(
        (prediction) =>
          String(prediction.rt) === route.rt &&
          String(prediction.stpid) === route.stpid &&
          !isHiddenPrediction(prediction)
      )
      .slice(0, MAX_ARRIVALS)
      .map(mapArrival);

    const firstMatch = predictions.find(
      (prediction) =>
        String(prediction.rt) === route.rt &&
        String(prediction.stpid) === route.stpid
    );

    return {
      rt: route.rt,
      rtdir: firstMatch?.rtdir || route.rtdir,
      stpid: route.stpid,
      stpnm: firstMatch?.stpnm || firstMatch?.stpmn || route.stpnm,
      arrivals,
    };
  });
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const apiKey = process.env.CTA_BUS_TRACKER_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, {
      error: "server_misconfigured",
      message: "Missing CTA Bus Tracker API key",
    });
  }

  const stopIds = TRACKED_ROUTES.map((route) => route.stpid).join(",");
  const params = new URLSearchParams({
    key: apiKey,
    stpid: stopIds,
    format: "json",
  });

  let data;
  try {
    const response = await fetch(`${CTA_PREDICTIONS_URL}?${params}`);
    if (!response.ok) {
      return jsonResponse(502, {
        error: "cta_unavailable",
        message: "CTA Bus Tracker request failed",
      });
    }
    data = await response.json();
  } catch {
    return jsonResponse(502, {
      error: "cta_unavailable",
      message: "CTA Bus Tracker request failed",
    });
  }

  const payload = data?.["bustime-response"] ?? {};
  const predictions = asArray(payload.prd);

  return jsonResponse(200, {
    routes: groupRoutes(predictions),
  });
};
