const STORAGE_KEY = "guten-morgen-google-token";

let accessToken: string | null = null;
let tokenExpiresAt = 0;

type StoredToken = {
  accessToken: string;
  expiresAt: number;
};

function persistToken() {
  if (!accessToken) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  const payload: StoredToken = {
    accessToken,
    expiresAt: tokenExpiresAt,
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function restoreGoogleAccessToken(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw) as StoredToken;

    if (!parsed.accessToken || Date.now() >= parsed.expiresAt - 60_000) {
      sessionStorage.removeItem(STORAGE_KEY);
      accessToken = null;
      tokenExpiresAt = 0;
      return false;
    }

    accessToken = parsed.accessToken;
    tokenExpiresAt = parsed.expiresAt;
    return true;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

export function setGoogleAccessToken(
  token: string,
  expiresInSeconds?: number
) {
  accessToken = token;

  tokenExpiresAt = expiresInSeconds
    ? Date.now() + expiresInSeconds * 1000
    : Date.now() + 55 * 60 * 1000;

  persistToken();
}

export function clearGoogleAccessToken() {
  accessToken = null;
  tokenExpiresAt = 0;
  persistToken();
}

export function getGoogleAccessToken(): string | null {
  if (!accessToken) {
    restoreGoogleAccessToken();
  }

  if (!accessToken) {
    return null;
  }

  if (Date.now() >= tokenExpiresAt - 60_000) {
    clearGoogleAccessToken();
    return null;
  }

  return accessToken;
}

export function requireGoogleAccessToken(): string {
  const token = getGoogleAccessToken();

  if (!token) {
    throw new Error("Google authorization is required");
  }

  return token;
}
