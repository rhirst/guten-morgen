const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_REDIRECT_URI = "postmessage";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function getClientId() {
  return process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
}

function pickTokenResponse(data) {
  const payload = {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };

  if (data.refresh_token) {
    payload.refresh_token = data.refresh_token;
  }

  return payload;
}

async function exchangeWithGoogle(params) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error =
      typeof data?.error === "string" ? data.error : "token_exchange_failed";
    const errorDescription =
      typeof data?.error_description === "string"
        ? data.error_description
        : "Google token request failed";

    return jsonResponse(response.status, {
      error,
      error_description: errorDescription,
    });
  }

  if (!data?.access_token) {
    return jsonResponse(502, {
      error: "token_exchange_failed",
      error_description: "Google did not return an access token",
    });
  }

  return jsonResponse(200, pickTokenResponse(data));
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const clientId = getClientId();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return jsonResponse(500, {
      error: "server_misconfigured",
      error_description: "Missing Google OAuth client credentials",
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, {
      error: "invalid_request",
      error_description: "Request body must be JSON",
    });
  }

  if (body.grant === "code") {
    if (typeof body.code !== "string" || !body.code) {
      return jsonResponse(400, {
        error: "invalid_request",
        error_description: "Missing authorization code",
      });
    }

    const redirectUri =
      typeof body.redirect_uri === "string" && body.redirect_uri
        ? body.redirect_uri
        : DEFAULT_REDIRECT_URI;

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: body.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    return exchangeWithGoogle(params);
  }

  if (body.grant === "refresh") {
    if (typeof body.refresh_token !== "string" || !body.refresh_token) {
      return jsonResponse(400, {
        error: "invalid_request",
        error_description: "Missing refresh token",
      });
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: body.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    });

    return exchangeWithGoogle(params);
  }

  return jsonResponse(400, {
    error: "invalid_request",
    error_description: 'grant must be "code" or "refresh"',
  });
};
