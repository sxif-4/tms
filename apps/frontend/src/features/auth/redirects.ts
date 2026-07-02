import type { Role } from "./types";

/**
 * Where each role lands after authenticating. Single source of truth for
 * post-login/-signup redirects and the "already signed in" guards on the auth
 * pages. Every path here must resolve to a real route, or the user 404s.
 */
export const roleLandingPath: Record<Role, string> = {
  visitor: "/",
  hotel_staff: "/dashboard/hotel",
  ferry_staff: "/dashboard/ferry",
  park_staff: "/dashboard/park",
  admin: "/dashboard/admin",
};

/** Landing path for a role, falling back to home for anything unmapped. */
export function landingPathForRole(role: Role): string {
  return roleLandingPath[role] ?? "/";
}
