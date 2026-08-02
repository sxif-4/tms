import { API_URL } from "~/features/auth/api";

/** Origin of the API, e.g. `http://localhost:4000` from `.../api/v1`. */
export const API_ORIGIN = new URL(API_URL).origin;

/**
 * Resolves an image reference for use in `src`. Uploaded images are stored as
 * API-relative paths (`/uploads/…`) while seeded ones are absolute remote URLs,
 * so both shapes have to work.
 */
export function imageUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${API_ORIGIN}${url}`;
}
