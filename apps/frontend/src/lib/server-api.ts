import { getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { API_URL } from "~/features/auth/api";

type FetchInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

/**
 * Calls the API as the signed-in user from the SSR server, forwarding the
 * browser's httpOnly cookies. On a 401 it refreshes the access token once,
 * relays the rotated cookies back to the browser, and retries with them —
 * mirroring the strategy used by `getCurrentUser`. Shared by every admin
 * server function.
 */
export async function apiFetch(
  path: string,
  init: FetchInit = {},
): Promise<Response> {
  const cookie = getRequestHeader("cookie") ?? "";
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...init.headers, cookie },
  });
  if (res.status !== 401) return res;

  // Access token expired — refresh, relay the rotated cookies, retry once.
  const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: "{}",
  });
  if (!refreshRes.ok) return res; // refresh failed — surface the original 401

  relaySetCookies(refreshRes);
  const refreshed = cookieFromSetCookies(refreshRes) || cookie;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...init.headers, cookie: refreshed },
  });
}

/** Forward the API's Set-Cookie headers onto the SSR response to the browser. */
function relaySetCookies(res: Response): void {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    const maxAge = /max-age=(\d+)/i.exec(raw)?.[1];
    setCookie(name, value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false, // dev over http://localhost; set true behind HTTPS
      ...(maxAge ? { maxAge: Number(maxAge) } : {}),
    });
  }
}

/** Build a Cookie header from a response's Set-Cookie headers (for the retry). */
function cookieFromSetCookies(res: Response): string {
  return (res.headers.getSetCookie?.() ?? [])
    .map((raw) => raw.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

/** Reads a `{ message }` error body from a failed API response. */
export async function errorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  const message = Array.isArray(body?.message)
    ? body?.message[0]
    : body?.message;
  return message ?? fallback;
}
