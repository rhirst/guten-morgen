import { requireGoogleAccessToken } from "./googleAuth";

export async function googleFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = requireGoogleAccessToken();

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

    throw new Error(
      `Google API request failed (${response.status}): ${body}`
    );
  }

  return response.json() as Promise<T>;
}