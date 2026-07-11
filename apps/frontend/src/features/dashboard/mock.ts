import type { LucideIcon } from "lucide-react";
import {
  PartyPopperIcon,
  RocketIcon,
  SparklesIcon,
  WavesIcon,
} from "lucide-react";

/**
 * Placeholder dashboard data. The overview KPIs and revenue come from the API,
 * but hotel occupancy / event activity / customer requests aren't exposed by
 * the backend yet — these mocks flesh out the admin overview until they are.
 *
 * `image` URLs are stand-in Unsplash photos; swap them for the real cover
 * images once the API serves them (the thumbnail falls back to a tinted glyph
 * if a URL fails to load).
 */

const thumb = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=96&h=96&q=80`;

export interface HotelOccupancy {
  id: string;
  name: string;
  location: string;
  /** Occupancy as a percentage (0–100). */
  occupancy: number;
  roomsBooked: number;
  totalRooms: number;
  /** Recent occupancy readings, oldest → newest. */
  trend: number[];
  image: string;
  accent: string;
}

export const TOP_HOTELS: HotelOccupancy[] = [
  {
    id: "coral-bay",
    name: "Coral Bay Resort",
    location: "Sunset Pier",
    occupancy: 96,
    roomsBooked: 154,
    totalRooms: 160,
    trend: [88, 90, 89, 92, 94, 93, 95, 96],
    image: thumb("1566073771259-6a8506099945"),
    accent: "var(--series-hotel)",
  },
  {
    id: "seabreeze",
    name: "Seabreeze Lodge",
    location: "Harbour Front",
    occupancy: 91,
    roomsBooked: 82,
    totalRooms: 90,
    trend: [84, 86, 85, 88, 87, 90, 89, 91],
    image: thumb("1571003123894-1f0594d2b5d9"),
    accent: "var(--series-ferry)",
  },
  {
    id: "fantasy-inn",
    name: "Fantasy Kingdom Inn",
    location: "Park Central",
    occupancy: 88,
    roomsBooked: 106,
    totalRooms: 120,
    trend: [80, 82, 85, 84, 86, 87, 86, 88],
    image: thumb("1445019980597-93fa8acb246c"),
    accent: "#8b5cf6",
  },
  {
    id: "pinecrest",
    name: "Pinecrest Retreat",
    location: "Forest Edge",
    occupancy: 84,
    roomsBooked: 63,
    totalRooms: 75,
    trend: [78, 80, 79, 82, 81, 83, 82, 84],
    image: thumb("1520250497591-112f2f40a3f4"),
    accent: "var(--series-park)",
  },
];

export interface ActiveEvent {
  id: string;
  name: string;
  venue: string;
  schedule: string;
  ticketsSold: number;
  capacity: number;
  /** Cumulative tickets sold through the day, oldest → newest. */
  trend: number[];
  image: string;
  icon: LucideIcon;
  accent: string;
}

export const ACTIVE_EVENTS: ActiveEvent[] = [
  {
    id: "coaster-rave",
    name: "Midnight Coaster Rave",
    venue: "Coaster 778A",
    schedule: "Tonight · 9:00 PM",
    ticketsSold: 1240,
    capacity: 1500,
    trend: [180, 340, 520, 700, 880, 1020, 1140, 1240],
    image: thumb("1514525253161-7a46d19cd819"),
    icon: RocketIcon,
    accent: "#8b5cf6",
  },
  {
    id: "kingdom-parade",
    name: "Fantasy Kingdom Parade",
    venue: "Fantasy Kingdom",
    schedule: "Today · 6:30 PM",
    ticketsSold: 980,
    capacity: 1200,
    trend: [120, 260, 400, 540, 680, 800, 900, 980],
    image: thumb("1533174072545-7a4b6ad7a6c3"),
    icon: PartyPopperIcon,
    accent: "var(--primary)",
  },
  {
    id: "aqua-splash",
    name: "Aqua Splash Festival",
    venue: "Water Park",
    schedule: "Today · 2:00 PM",
    ticketsSold: 760,
    capacity: 900,
    trend: [90, 200, 320, 430, 540, 640, 710, 760],
    image: thumb("1530103862676-de8c9debad1d"),
    icon: WavesIcon,
    accent: "var(--series-hotel)",
  },
  {
    id: "skyline-show",
    name: "Skyline Light Show",
    venue: "Grand Ferris Wheel",
    schedule: "Tonight · 8:15 PM",
    ticketsSold: 540,
    capacity: 700,
    trend: [60, 140, 230, 320, 400, 470, 510, 540],
    image: thumb("1470229722913-7c0e2dbbafd3"),
    icon: SparklesIcon,
    accent: "var(--series-park)",
  },
];

export type RequestStatus = "new" | "pending" | "urgent";

export interface CustomerRequest {
  id: string;
  customer: string;
  subject: string;
  type: "Refund" | "Booking" | "Support";
  time: string;
  status: RequestStatus;
}

export const CUSTOMER_REQUESTS: CustomerRequest[] = [
  {
    id: "req-1",
    customer: "Amara Okafor",
    subject: "Refund for cancelled ferry crossing",
    type: "Refund",
    time: "12m ago",
    status: "urgent",
  },
  {
    id: "req-2",
    customer: "Liam Chen",
    subject: "Extend stay at Coral Bay by 2 nights",
    type: "Booking",
    time: "34m ago",
    status: "new",
  },
  {
    id: "req-3",
    customer: "Sofia Rossi",
    subject: "Wheelchair access for parade seating",
    type: "Support",
    time: "1h ago",
    status: "pending",
  },
  {
    id: "req-4",
    customer: "Noah Williams",
    subject: "Group discount for 12 guests",
    type: "Booking",
    time: "2h ago",
    status: "new",
  },
  {
    id: "req-5",
    customer: "Ava Martinez",
    subject: "Lost item at Fantasy Kingdom",
    type: "Support",
    time: "3h ago",
    status: "pending",
  },
];
