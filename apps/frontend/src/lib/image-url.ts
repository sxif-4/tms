import { API_URL } from "~/features/auth/api";

/** Origin of the API, e.g. `http://localhost:4000` from `.../api/v1`. */
export const API_ORIGIN = new URL(API_URL).origin;

/**
 * Resolves an image reference for use in `src`. Three shapes occur:
 *
 * - `https://…`            — seeded remote images, used as-is.
 * - `/uploads/…`           — uploaded via the API, served from its origin.
 * - any other relative path — a static asset in this app's `public/` folder
 *   (some seeded advertisements point at `/images/…`), served from here.
 *
 * Only `/uploads/` is rewritten: sending the rest to the API origin would 404,
 * since those files only exist on the frontend.
 */
export function imageUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/uploads/") ? `${API_ORIGIN}${url}` : url;
}
