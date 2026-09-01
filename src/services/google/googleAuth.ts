const STORAGE_KEY = "guten-morgen-google-token";
const TOKEN_ENDPOINT = "/.netlify/functions/google-oauth-token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const EXPIRY_SKEW_MS = 5 * 60 * 1000;

type StoredToken = {
  accessToken: string;
  expiresAt: number;
  refreshToken: string | null;
};

export type GoogleTokenSet = {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string | null;
};

export class GoogleAuthError extends Error {
  errorCode?: string;

  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = "GoogleAuthError";
    this.errorCode = errorCode;
  }
}

let accessToken: string | null = null;
let tokenExpiresAt = 0;
let refreshToken: string | null = null;
let refreshInFlight: Promise<string> | null = null;

type AuthLostListener = () => void;
const authLostListeners = new Set<AuthLostListener>();

export function subscribeGoogleAuthLost(listener: AuthLostListener) {
  authLostListeners.add(listener);

  return () => {
    authLostListeners.delete(listener);
  };
}

function notifyAuthLost() {
  for (const listener of authLostListeners) {
    listener();
  }
}

function persistToken() {
  if (typeof window === "undefined") {
    return;
  }

  if (!accessToken && !refreshToken) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const payload: StoredToken = {
    accessToken: accessToken ?? "",
    expiresAt: tokenExpiresAt,
    refreshToken,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restoreFromStorage() {
  if (typeof window === "undefined") {
    return;
  }

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    accessToken = null;
    tokenExpiresAt = 0;
    refreshToken = null;
    return;
  }

  try {
    const parsed = JSON.parse(raw) as StoredToken;
    accessToken = parsed.accessToken || null;
    tokenExpiresAt = parsed.expiresAt || 0;
    refreshToken = parsed.refreshToken || null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    accessToken = null;
    tokenExpiresAt = 0;
    refreshToken = null;
  }
}

function restoreIfNeeded() {
  if (accessToken || refreshToken) {
    return;
  }

  restoreFromStorage();
}

function accessTokenIsFresh() {
  return Boolean(accessToken) && Date.now() < tokenExpiresAt - EXPIRY_SKEW_MS;
}

export function restoreGoogleAccessToken(): boolean {
  restoreFromStorage();
  return isGoogleAuthorized();
}

export function isGoogleAuthorized(): boolean {
  restoreIfNeeded();
  return Boolean(refreshToken || accessTokenIsFresh());
}

export function setGoogleTokens(tokens: GoogleTokenSet) {
  accessToken = tokens.accessToken;
  tokenExpiresAt = tokens.expiresIn
    ? Date.now() + tokens.expiresIn * 1000
    : Date.now() + 55 * 60 * 1000;

  if (tokens.refreshToken) {
    refreshToken = tokens.refreshToken;
  }

  persistToken();
}

type TokenEndpointResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

async function postToken(body: Record<string, string>): Promise<{
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
}> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as
    | TokenEndpointResponse
    | null;

  if (!response.ok || !data?.access_token) {
    throw new GoogleAuthError(
      data?.error_description || "Google token request failed",
      data?.error
    );
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token,
  };
}

export async function exchangeGoogleAuthCode(code: string): Promise<void> {
  const data = await postToken({
    grant: "code",
    code,
    redirect_uri: "postmessage",
  });

  if (!data.refresh_token && !refreshToken) {
    throw new GoogleAuthError(
      "Google did not return a refresh token. Reconnect and grant offline access.",
      "missing_refresh_token"
    );
  }

  setGoogleTokens({
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
  });
}

async function refreshAccessToken(): Promise<string> {
  restoreIfNeeded();

  if (!refreshToken) {
    clearStoredTokens();
    notifyAuthLost();
    throw new GoogleAuthError(
      "Google authorization is required",
      "authorization_required"
    );
  }

  try {
    const data = await postToken({
      grant: "refresh",
      refresh_token: refreshToken,
    });

    setGoogleTokens({
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
    });

    if (!accessToken) {
      throw new GoogleAuthError(
        "Google token refresh failed",
        "token_exchange_failed"
      );
    }

    return accessToken;
  } catch (error) {
    if (error instanceof GoogleAuthError && error.errorCode === "invalid_grant") {
      clearStoredTokens();
      notifyAuthLost();
    }

    throw error;
  }
}

export async function ensureGoogleAccessToken(options?: {
  force?: boolean;
}): Promise<string> {
  restoreIfNeeded();

  if (!options?.force && accessTokenIsFresh() && accessToken) {
    return accessToken;
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = refreshAccessToken().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export function getGoogleAccessToken(): string | null {
  restoreIfNeeded();

  if (accessTokenIsFresh()) {
    return accessToken;
  }

  return null;
}

export async function requireGoogleAccessToken(): Promise<string> {
  return ensureGoogleAccessToken();
}

function clearStoredTokens() {
  accessToken = null;
  tokenExpiresAt = 0;
  refreshToken = null;
  persistToken();
}

export async function clearGoogleAccessToken() {
  restoreIfNeeded();
  const tokenToRevoke = refreshToken || accessToken;
  clearStoredTokens();

  if (!tokenToRevoke) {
    return;
  }

  try {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ token: tokenToRevoke }),
    });
  } catch {
    // Revoke is best-effort; local credentials are already cleared.
  }
}
