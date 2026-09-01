import { ensureGoogleAccessToken } from "./googleAuth";

async function fetchWithToken<T>(
  url: string,
  options: RequestInit,
  accessToken: string
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, status: response.status, body };
  }

  return { ok: true, data: (await response.json()) as T };
}

export async function googleFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await ensureGoogleAccessToken();
  const first = await fetchWithToken<T>(url, options, accessToken);

  if (first.ok) {
    return first.data;
  }

  if (first.status === 401) {
    const retryToken = await ensureGoogleAccessToken({ force: true });
    const retry = await fetchWithToken<T>(url, options, retryToken);

    if (retry.ok) {
      return retry.data;
    }

    throw new Error(
      `Google API request failed (${retry.status}): ${retry.body}`
    );
  }

  throw new Error(
    `Google API request failed (${first.status}): ${first.body}`
  );
}
