import type { ReactNode } from "react";
import {
  LayoutGridIcon,
  BarChart3Icon,
  UsersIcon,
  SettingsIcon,
  HotelIcon,
  BedDoubleIcon,
  ShipIcon,
  MapIcon,
  FerrisWheelIcon,
  TicketIcon,
  CalendarCheckIcon,
  CalendarClockIcon,
  ScanLineIcon,
  PercentIcon,
  UserRoundSearchIcon,
  ShieldCheckIcon,
  ScrollTextIcon,
  MegaphoneIcon,
} from "lucide-react";
import type { Role } from "~/features/auth";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

/**
 * Sidebar navigation defined per role. The logged-in user's role selects which
 * groups render (see `getNavGroups`). Paths are placeholders (`#/...`) until the
 * matching routes exist — fill them in as features land.
 */
export const navGroupsByRole: Record<Role, SidebarNavGroup[]> = {
  // Visitors never see this sidebar: it only renders inside `AppShell`, under
  // /dashboard, and `dashboard/route.tsx` redirects visitors to `/`. They
  // navigate via SiteHeader instead, so there is nothing to declare here.
  visitor: [],
  hotel_staff: [
    {
      label: "Hotel",
      items: [
        {
          title: "Dashboard",
          path: "/dashboard/hotel/",
          icon: <LayoutGridIcon />,
        },
        {
          title: "Rooms",
          path: "/dashboard/hotel/rooms",
          icon: <BedDoubleIcon />,
        },
        {
          title: "Bookings",
          path: "/dashboard/hotel/bookings",
          icon: <CalendarCheckIcon />,
        },
      ],
    },
    {
      label: "Insights",
      items: [
        {
          title: "Reports",
          path: "/dashboard/hotel/reports",
          icon: <BarChart3Icon />,
        },
        {
          title: "Promotions",
          path: "/dashboard/hotel/promotions",
          icon: <PercentIcon />,
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Settings",
          path: "/dashboard/hotel/settings",
          icon: <SettingsIcon />,
        },
      ],
    },
  ],
  ferry_staff: [
    {
      label: "Ferry",
      items: [
        {
          title: "Dashboard",
          path: "/dashboard/ferry/",
          icon: <LayoutGridIcon />,
        },
        { title: "Routes", path: "/dashboard/ferry/routes", icon: <MapIcon /> },
        {
          title: "Schedules",
          path: "/dashboard/ferry/schedules",
          icon: <CalendarCheckIcon />,
        },
        {
          title: "Bookings",
          path: "/dashboard/ferry/bookings",
          icon: <TicketIcon />,
        },
        {
          title: "Validate",
          path: "/dashboard/ferry/validate",
          icon: <ScanLineIcon />,
        },
      ],
    },
    {
      label: "Insights",
      items: [
        {
          title: "Reports",
          path: "/dashboard/ferry/reports",
          icon: <BarChart3Icon />,
        },
      ],
    },
  ],
  park_staff: [
    {
      label: "Theme Park",
      items: [
        {
          title: "Dashboard",
          path: "/dashboard/park/",
          icon: <LayoutGridIcon />,
        },
        {
          title: "Events",
          path: "/dashboard/park/events",
          icon: <FerrisWheelIcon />,
        },
        {
          title: "Tickets",
          path: "/dashboard/park/tickets",
          icon: <TicketIcon />,
        },
        { title: "Gate", path: "/dashboard/park/gate", icon: <ScanLineIcon /> },
        {
          title: "Bookings",
          path: "/dashboard/park/bookings",
          icon: <CalendarCheckIcon />,
        },
      ],
    },
    {
      label: "Capacity",
      items: [
        {
          title: "Availability",
          path: "/dashboard/park/availability",
          icon: <CalendarClockIcon />,
        },
      ],
    },
    {
      label: "Insights",
      items: [
        {
          title: "Reports",
          path: "/dashboard/park/reports",
          icon: <BarChart3Icon />,
        },
        {
          title: "Promotions",
          path: "/dashboard/park/promotions",
          icon: <PercentIcon />,
        },
      ],
    },
  ],
  admin: [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          path: "/dashboard/admin/",
          icon: <LayoutGridIcon />,
        },
        {
          title: "Analytics",
          path: "/dashboard/admin/analytics",
          icon: <BarChart3Icon />,
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          title: "Hotels",
          path: "/dashboard/admin/hotels",
          icon: <HotelIcon />,
        },
        { title: "Ferries", path: "/dashboard/ferry/", icon: <ShipIcon /> },
        {
          title: "Theme Park",
          path: "/dashboard/park/",
          icon: <FerrisWheelIcon />,
        },
        {
          title: "Customers",
          path: "/dashboard/admin/customers",
          icon: <UserRoundSearchIcon />,
        },
        {
          title: "Advertisements",
          path: "/dashboard/admin/ads",
          icon: <MegaphoneIcon />,
        },
        {
          title: "Promotions",
          path: "/dashboard/admin/promotions",
          icon: <PercentIcon />,
        },
        {
          title: "Map & Locations",
          path: "/dashboard/admin/map",
          icon: <MapIcon />,
        },
      ],
    },
    {
      label: "Administration",
      items: [
        { title: "Users", path: "/dashboard/admin/users", icon: <UsersIcon /> },
        {
          title: "Audit Logs",
          path: "/dashboard/admin/audit-logs",
          icon: <ScrollTextIcon />,
        },
        {
          title: "Roles",
          path: "/dashboard/admin/roles",
          icon: <ShieldCheckIcon />,
        },
        {
          title: "Settings",
          path: "/dashboard/admin/settings",
          icon: <SettingsIcon />,
        },
      ],
    },
  ],
};

/** Sidebar groups for a role. Returns an empty menu when there's no role. */
export function getNavGroups(role: Role | undefined): SidebarNavGroup[] {
  return role ? (navGroupsByRole[role] ?? []) : [];
}

/** Flat list of a role's links for breadcrumb/active lookups. */
export function getNavLinks(role: Role | undefined): SidebarNavItem[] {
  return getNavGroups(role).flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item],
    ),
  );
}

function withoutTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/** Whether a nav item's `path` matches the current route. Placeholder (`#/...`) paths never match. */
export function isNavPathActive(pathname: string, path?: string): boolean {
  return (
    !!path &&
    !path.startsWith("#") &&
    withoutTrailingSlash(pathname) === withoutTrailingSlash(path)
  );
}
