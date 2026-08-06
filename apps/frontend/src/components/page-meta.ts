/**
 * Page titles for the dashboard shell. The title/description used to live in
 * each page as an `<h1>` + lead paragraph; the shell header renders them now,
 * so they are declared here in one place, keyed by route path.
 *
 * A `$name` segment matches any single segment, so dynamic routes get an entry
 * too. When two patterns match, the one with more literal segments wins.
 */
export type PageMeta = {
  title: string;
  description?: string;
};

const pageMeta: Record<string, PageMeta> = {
  // ---- Admin ----
  "/dashboard/admin": {
    title: "Dashboard",
    description: "What needs attention today across every domain.",
  },
  "/dashboard/admin/analytics": {
    title: "Analytics",
    description: "Sales and usage across every domain.",
  },
  "/dashboard/admin/hotels": {
    title: "Hotels",
    description:
      "Add hotels, edit their details, and suspend any that shouldn't take bookings right now.",
  },
  "/dashboard/admin/ads": {
    title: "Advertisements",
    description: "Manage promotional banners shown across the site.",
  },
  "/dashboard/admin/promotions": {
    title: "Promotions",
    description: "Manage discount campaigns and view their redemptions.",
  },
  "/dashboard/admin/map": {
    title: "Map & locations",
    description: "Click the map to drop a pin, or drag a pin to reposition it.",
  },
  "/dashboard/admin/users": {
    title: "Users",
    description:
      "Manage accounts, roles, and access for everyone in the system.",
  },
  "/dashboard/admin/customers": {
    title: "Customers",
    description:
      "Look up a customer to see every booking and payment they hold.",
  },
  "/dashboard/admin/customers/$customerId": {
    title: "Customer",
    description: "Bookings and payments across every domain.",
  },
  "/dashboard/admin/audit-logs": {
    title: "Audit logs",
    description: "A record of privileged actions across the system.",
  },
  "/dashboard/admin/roles": {
    title: "Roles",
    description:
      "The system uses one role per user. Assign roles from the Users page.",
  },
  "/dashboard/admin/settings": {
    title: "Settings",
    description: "Your account and workspace preferences.",
  },

  // ---- Hotel ----
  "/dashboard/hotel": {
    title: "Dashboard",
    description: "An overview of occupancy, bookings, and revenue.",
  },
  "/dashboard/hotel/rooms": {
    title: "Rooms",
    description: "This hotel's room types, their pricing and live inventory.",
  },
  "/dashboard/hotel/rooms/new": {
    title: "New room type",
    description: "Add a room type to this hotel, then stock it with rooms.",
  },
  "/dashboard/hotel/rooms/$roomTypeId": {
    title: "Room type",
    description: "Update this room type's details and pricing.",
  },
  "/dashboard/hotel/bookings": {
    title: "Bookings",
    description:
      "Assign rooms and manage the booking lifecycle for this hotel.",
  },
  "/dashboard/hotel/reports": {
    title: "Reports",
    description:
      "Revenue and occupancy trends for this hotel, last 30 to next 30 days.",
  },
  "/dashboard/hotel/promotions": {
    title: "Promotions",
    description: "Manage discount campaigns and view their redemptions.",
  },
  "/dashboard/hotel/settings": {
    title: "Settings",
    description: "Your account and workspace preferences.",
  },

  // ---- Ferry ----
  "/dashboard/ferry": {
    title: "Ferry control center",
    description:
      "Validate ticket requests, review sailings, and keep passenger flow smooth for the island's busiest routes.",
  },
  "/dashboard/ferry/routes": {
    title: "Ferry routes",
    description:
      "Monitor island routes, service frequency, and passenger capacity from one place.",
  },
  "/dashboard/ferry/schedules": {
    title: "Ferry schedules",
    description:
      "Plan departures, track route capacity, and keep each sailing aligned with expected demand.",
  },
  "/dashboard/ferry/bookings": {
    title: "Ferry bookings",
    description:
      "Review ferry reservations, confirm eligibility, and issue passes without interruption.",
  },

  // ---- Theme park ----
  "/dashboard/park": {
    title: "Theme park dashboard",
    description: "Today at a glance across tickets, revenue and the gate.",
  },
  "/dashboard/park/events": {
    title: "Events",
    description: "Rides, shows and beach events, and when each one runs.",
  },
  "/dashboard/park/tickets": {
    title: "Ticket sales",
    description:
      "The priced catalog, and every ticket sold across both channels.",
  },
  "/dashboard/park/gate": {
    title: "Gate",
    description: "Check visitors in, or sell a ticket on the spot.",
  },
  "/dashboard/park/bookings": {
    title: "Event bookings",
    description: "Seats visitors have booked on rides, shows and beach events.",
  },
  "/dashboard/park/availability": {
    title: "Availability",
    description:
      "How many tickets each day can sell. Click a day to cap it or close the park.",
  },
  "/dashboard/park/reports": {
    title: "Reports",
    description:
      "Sales, visitors and event performance. Defaults to the last 30 days through the next 30.",
  },
  "/dashboard/park/promotions": {
    title: "Event promotions",
    description: "Discount campaigns on rides, shows and beach events.",
  },
};

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/** Literal segments matched, or -1 when the pattern doesn't fit the path. */
function score(pattern: string, pathname: string): number {
  const patternParts = segments(pattern);
  const pathParts = segments(pathname);
  if (patternParts.length !== pathParts.length) return -1;

  let literals = 0;
  for (const [index, part] of patternParts.entries()) {
    if (part.startsWith("$")) continue;
    if (part !== pathParts[index]) return -1;
    literals += 1;
  }
  return literals;
}

/** The heading for a route, or `undefined` for pages outside the dashboard. */
export function getPageMeta(pathname: string): PageMeta | undefined {
  let best: PageMeta | undefined;
  let bestScore = -1;

  for (const [pattern, meta] of Object.entries(pageMeta)) {
    const patternScore = score(pattern, pathname);
    if (patternScore > bestScore) {
      best = meta;
      bestScore = patternScore;
    }
  }

  return best;
}
