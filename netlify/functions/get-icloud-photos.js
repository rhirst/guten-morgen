const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function base62ToInt(value) {
  let result = 0;
  for (const char of value) {
    const index = BASE62.indexOf(char);
    if (index === -1) {
      return 0;
    }
    result = result * 62 + index;
  }
  return result;
}

function getPartitionFromToken(token) {
  const partition =
    token[0] === "A"
      ? base62ToInt(token[1])
      : base62ToInt(token.substring(1, 3));
  return partition < 10 ? `0${partition}` : String(partition);
}

function getStreamBaseUrl(token) {
  return `https://p${getPartitionFromToken(token)}-sharedstreams.icloud.com/${token}/sharedstreams`;
}

function extractToken(rawUrl) {
  const match = rawUrl.match(
    /(?:sharedalbum\/#|shared\/album\/)([A-Za-z0-9_-]+)/
  );
  return match?.[1] ?? null;
}

async function postAppleJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  return { response, data };
}

async function fetchWebstream(token) {
  const initialUrl = `${getStreamBaseUrl(token)}/webstream`;
  const { response, data } = await postAppleJson(initialUrl, {
    streamCtag: null,
  });

  // Apple uses a custom 330 redirect with the new host in the JSON body.
  if (response.status === 330 && data?.["X-Apple-MMe-Host"]) {
    const redirectedUrl = `https://${data["X-Apple-MMe-Host"]}/${token}/sharedstreams/webstream`;
    const redirected = await postAppleJson(redirectedUrl, { streamCtag: null });
    if (!redirected.response.ok) {
      throw new Error(
        `iCloud webstream redirect failed (${redirected.response.status})`
      );
    }
    return {
      streamData: redirected.data,
      hostBase: `https://${data["X-Apple-MMe-Host"]}/${token}/sharedstreams`,
    };
  }

  if (!response.ok) {
    throw new Error(`iCloud webstream failed (${response.status})`);
  }

  return {
    streamData: data,
    hostBase: getStreamBaseUrl(token),
  };
}

function largestDerivativeChecksum(photo) {
  const derivatives = photo?.derivatives;
  if (!derivatives || typeof derivatives !== "object") {
    return null;
  }

  let bestChecksum = null;
  let bestSize = -1;

  for (const derivative of Object.values(derivatives)) {
    const size = Number(derivative?.fileSize ?? 0);
    const checksum = derivative?.checksum;
    if (typeof checksum === "string" && size >= bestSize) {
      bestSize = size;
      bestChecksum = checksum;
    }
  }

  return bestChecksum;
}

function buildImageUrl(location) {
  if (!location?.url_location || !location?.url_path) {
    return null;
  }
  return `https://${location.url_location}${location.url_path}`;
}

export const handler = async (event) => {
  const rawUrl = event.queryStringParameters?.url;

  if (!rawUrl) {
    return jsonResponse(400, { error: "Missing album URL" });
  }

  const token = extractToken(rawUrl);
  if (!token) {
    return jsonResponse(400, {
      error: "Invalid iCloud Shared Album URL format",
    });
  }

  try {
    const { streamData, hostBase } = await fetchWebstream(token);
    const photos = Array.isArray(streamData?.photos) ? streamData.photos : [];
    const photoGuids = photos.map((photo) => photo.photoGuid).slice(0, 150);

    if (photoGuids.length === 0) {
      return jsonResponse(200, []);
    }

    const { response: urlResponse, data: urlData } = await postAppleJson(
      `${hostBase}/webasseturls`,
      { photoGuids }
    );

    if (!urlResponse.ok) {
      return jsonResponse(502, {
        error: `iCloud webasseturls failed (${urlResponse.status})`,
      });
    }

    const locations = urlData?.items ?? {};
    const cleanImages = photos
      .map((photo) => {
        const checksum = largestDerivativeChecksum(photo);
        const location = checksum ? locations[checksum] : null;
        const url = buildImageUrl(location);
        if (!url) {
          return null;
        }
        return {
          id: photo.photoGuid,
          url,
          caption: photo.caption || "",
        };
      })
      .filter(Boolean);

    return jsonResponse(200, cleanImages);
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
