import type { Role } from "../auth/types";

/** Human-friendly labels for each role slug. */
export const ROLE_LABELS: Record<Role, string> = {
  visitor: "Visitor",
  hotel_staff: "Hotel Staff",
  ferry_staff: "Ferry Staff",
  park_staff: "Park Staff",
  admin: "Admin",
};

/**
 * Roles an admin can assign from the UI. `admin` is intentionally excluded —
 * the system is designed around a single administrator account.
 */
export const ASSIGNABLE_ROLES: Role[] = [
  "visitor",
  "hotel_staff",
  "ferry_staff",
  "park_staff",
];
