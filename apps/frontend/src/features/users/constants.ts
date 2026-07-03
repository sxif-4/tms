import type { Role } from "../auth/types";

/** Human-friendly labels for each role slug. */
export const ROLE_LABELS: Record<Role, string> = {
  visitor: "Visitor",
  hotel_staff: "Hotel Staff",
  ferry_staff: "Ferry Staff",
  park_staff: "Park Staff",
  admin: "Admin",
};

/** What each role can do — shown on the read-only Roles reference page. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  visitor: "Books hotels, ferries and park tickets; browses services and offers.",
  hotel_staff: "Manages hotel rooms, bookings and hotel promotions.",
  ferry_staff: "Validates ferry passes and manages schedules and capacity.",
  park_staff: "Runs park events, ticket sales and activity bookings.",
  admin: "Full access: users, content, map, promotions and reports.",
};

/** Every role, in presentation order. */
export const ALL_ROLES: Role[] = [
  "admin",
  "hotel_staff",
  "ferry_staff",
  "park_staff",
  "visitor",
];

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
