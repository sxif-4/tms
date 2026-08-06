import { API_URL } from "~/features/auth/api";

/**
 * Calls the API straight from the browser, retrying once after a 401 the way
 * `~/lib/server-api` does for SSR calls.
 *
 * Uploads are the reason this exists: they are multipart, and routing the bytes
 * through the SSR server just to forward them again would double the transfer
 * for no benefit. Nothing refreshes expired access tokens on the browser
 * client, so that is handled here.
 */
export async function browserFetch(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const send = () =>
    fetch(`${API_URL}${path}`, { ...init, credentials: "include" });

  const res = await send();
  if (res.status !== 401) return res;

  const refreshed = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  if (!refreshed.ok) return res; // surface the original 401

  return send();
}

/** Reads a `{ message }` error body from a failed API response. */
export async function failureMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    const message = Array.isArray(body.message)
      ? body.message[0]
      : body.message;
    return message ?? fallback;
  } catch {
    return fallback;
  }
}
