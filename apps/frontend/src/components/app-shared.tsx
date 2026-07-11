import type { ReactNode } from "react";
import {
  LayoutGridIcon,
  BarChart3Icon,
  UsersIcon,
  SettingsIcon,
  CreditCardIcon,
  HelpCircleIcon,
  BookOpenIcon,
  HotelIcon,
  BedDoubleIcon,
  ShipIcon,
  MapIcon,
  FerrisWheelIcon,
  TicketIcon,
  CalendarCheckIcon,
  TagIcon,
  PercentIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  ScrollTextIcon,
  MegaphoneIcon,
} from "lucide-react";
import type { Role } from "~/features/auth";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
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
  visitor: [
    {
      label: "Browse",
      items: [
        {
          title: "Dashboard",
          path: "#/dashboard",
          icon: <LayoutGridIcon />,
          isActive: true,
        },
        { title: "Hotels", path: "#/hotels", icon: <HotelIcon /> },
        { title: "Ferries", path: "#/ferries", icon: <ShipIcon /> },
        { title: "Theme Park", path: "#/park", icon: <FerrisWheelIcon /> },
      ],
    },
    {
      label: "My Trips",
      items: [
        {
          title: "My Bookings",
          path: "#/bookings",
          icon: <CalendarCheckIcon />,
        },
        { title: "Payments", path: "#/payments", icon: <CreditCardIcon /> },
        { title: "Offers", path: "#/offers", icon: <TagIcon /> },
      ],
    },
  ],
  hotel_staff: [
    {
      label: "Hotel",
      items: [
        {
          title: "Dashboard",
          path: "#/dashboard",
          icon: <LayoutGridIcon />,
          isActive: true,
        },
        { title: "Rooms", path: "#/rooms", icon: <BedDoubleIcon /> },
        { title: "Bookings", path: "#/bookings", icon: <CalendarCheckIcon /> },
        { title: "Guests", path: "#/guests", icon: <UsersIcon /> },
      ],
    },
    {
      label: "Insights",
      items: [{ title: "Reports", path: "#/reports", icon: <BarChart3Icon /> }],
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
          isActive: true,
        },
        { title: "Routes", path: "/dashboard/ferry/routes", icon: <MapIcon /> },
        {
          title: "Schedules",
          path: "/dashboard/ferry/schedules",
          icon: <CalendarCheckIcon />,
        },
        { title: "Bookings", path: "/dashboard/ferry/bookings", icon: <TicketIcon /> },
      ],
    },
    {
      label: "Insights",
      items: [
        { title: "Capacity", path: "#/capacity", icon: <BarChart3Icon /> },
      ],
    },
  ],
  park_staff: [
    {
      label: "Theme Park",
      items: [
        {
          title: "Dashboard",
          path: "#/dashboard",
          icon: <LayoutGridIcon />,
          isActive: true,
        },
        { title: "Events", path: "#/events", icon: <FerrisWheelIcon /> },
        { title: "Tickets", path: "#/tickets", icon: <TicketIcon /> },
        {
          title: "Event Bookings",
          path: "#/event-bookings",
          icon: <CalendarCheckIcon />,
        },
      ],
    },
    {
      label: "Insights",
      items: [{ title: "Reports", path: "#/reports", icon: <BarChart3Icon /> }],
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
          isActive: true,
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
        { title: "Hotels", path: "#/hotels", icon: <HotelIcon /> },
        { title: "Ferries", path: "#/ferries", icon: <ShipIcon /> },
        { title: "Theme Park", path: "#/park", icon: <FerrisWheelIcon /> },
        { title: "Payments", path: "#/payments", icon: <ReceiptIcon /> },
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

/** Footer links shown to every role. */
export const footerNavLinks: SidebarNavItem[] = [
  {
    title: "Help Center",
    path: "#/help",
    icon: <HelpCircleIcon />,
  },
  {
    title: "Documentation",
    path: "#/documentation",
    icon: <BookOpenIcon />,
  },
];

/** Sidebar groups for a role. Returns an empty menu when there's no role. */
export function getNavGroups(role: Role | undefined): SidebarNavGroup[] {
  return role ? (navGroupsByRole[role] ?? []) : [];
}

/** Flat list of a role's links (incl. footer) for breadcrumb/active lookups. */
export function getNavLinks(role: Role | undefined): SidebarNavItem[] {
  return [
    ...getNavGroups(role).flatMap((group) =>
      group.items.flatMap((item) =>
        item.subItems?.length ? [item, ...item.subItems] : [item],
      ),
    ),
    ...footerNavLinks,
  ];
}
