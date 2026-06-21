import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { API_URL } from "../auth/api";
import type { User } from "../auth/types";

type FetchInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

/**
 * Calls the API as the signed-in admin from the SSR server, forwarding the
 * browser's httpOnly cookies. On a 401 it refreshes the access token once,
 * relays the rotated cookies back to the browser, and retries with them —
 * mirroring the strategy used by `getCurrentUser`.
 */
async function apiFetch(path: string, init: FetchInit = {}): Promise<Response> {
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
async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  const message = Array.isArray(body?.message)
    ? body?.message[0]
    : body?.message;
  return message ?? fallback;
}

/** Lists every user (admin-only on the API). */
export const getUsersServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<User[]> => {
    const res = await apiFetch("/users");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load users"));
    return (await res.json()) as User[];
  },
);

const updateUserRoleSchema = z.object({
  id: z.number().int().positive(),
  role: z.enum(["visitor", "hotel_staff", "ferry_staff", "park_staff", "admin"]),
});

/** Reassigns a user to a different role (admin-only on the API). */
export const updateUserRoleServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateUserRoleSchema.parse(input))
  .handler(async ({ data }): Promise<User> => {
    const res = await apiFetch(`/users/${data.id}/role`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: data.role }),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update role"));
    return (await res.json()) as User;
  });
