/**
 * Row shapes returned by the park API (see apps/backend/src/modules/park-*).
 * Timestamps arrive as ISO strings over JSON, and money as decimal text —
 * never a float.
 */

export type EventType = "ride" | "show" | "beach_event";
export type LocationType = "theme_park" | "beach";

export type TicketStatus = "active" | "used" | "cancelled" | "refunded";
export type TicketChannel = "online" | "gate";
/** Staff may only cancel or refund; `used` is reachable only via gate check-in. */
export type TicketStatusTransition = "cancelled" | "refunded";

export type EventBookingStatus = "pending" | "confirmed" | "cancelled";
export type EventBookingTransition = "confirmed" | "cancelled";

/** Priced catalog visitors buy from. */
export interface ParkTicketType {
  id: number;
  name: string;
  /** Decimal as text, e.g. "60.00". */
  price: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParkEvent {
  id: number;
  name: string;
  description: string;
  eventType: EventType;
  locationType: LocationType;
  /** Decimal as text, e.g. "20.00". */
  basePrice: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `GET /events/:id` adds the schedule count. */
export interface ParkEventDetail extends ParkEvent {
  scheduleCount: number;
}

/** `booked`/`remaining` are computed by the API, never stored. */
export interface EventSchedule {
  id: number;
  eventId: number;
  eventName: string;
  startAt: string;
  capacity: number;
  booked: number;
  remaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParkTicket {
  id: number;
  ticketReference: string;
  userId: number;
  buyerName: string;
  buyerEmail: string;
  ticketTypeId: number;
  ticketTypeName: string;
  visitDate: string;
  quantity: number;
  /** Price snapshot at purchase — unaffected by later repricing. */
  totalAmount: string;
  channel: TicketChannel;
  soldByUserId: number | null;
  soldByName: string | null;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventBooking {
  id: number;
  bookingReference: string;
  userId: number;
  visitorName: string;
  visitorEmail: string;
  eventScheduleId: number;
  startAt: string;
  eventId: number;
  eventName: string;
  parkTicketId: number;
  ticketReference: string;
  quantity: number;
  totalAmount: string;
  status: EventBookingStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * One day of the availability calendar. `isDefault` means no override row
 * exists — the day runs on the configured default capacity, and is open.
 */
export interface ParkDay {
  date: string;
  capacity: number;
  sold: number;
  remaining: number;
  isClosed: boolean;
  note: string | null;
  isDefault: boolean;
}

export interface ChannelSplit {
  online: number;
  gate: number;
  total: number;
}

export interface RevenuePoint {
  day: string;
  revenue: number;
}

export interface GateTicketRow {
  id: number;
  ticketReference: string;
  buyerName: string;
  ticketTypeName: string;
  quantity: number;
  status: string;
  channel: string;
}

/** Dashboard schedule rows carry `startAt` as a unix timestamp, not an ISO string. */
export interface ScheduleFillRow {
  id: number;
  eventId: number;
  eventName: string;
  startAt: number;
  capacity: number;
  booked: number;
  fillRate: number;
}

export interface ParkDashboardResponse {
  kpis: {
    ticketsSoldToday: ChannelSplit;
    revenueToday: number;
    revenueLast30Days: number;
    visitorsCheckedInToday: number;
    todaysFill: {
      sold: number;
      capacity: number;
      remaining: number;
      fillRate: number;
      isClosed: boolean;
    };
  };
  capacityAlerts: {
    schedulesNearCapacity: ScheduleFillRow[];
    daysNearCapacity: ParkDay[];
    closedDays: ParkDay[];
  };
  todaysGate: {
    expected: number;
    checkedIn: number;
    notArrived: number;
    items: GateTicketRow[];
  };
  salesTrend: RevenuePoint[];
  upcomingSchedules: ScheduleFillRow[];
}

export type SalesGroupBy = "day" | "ticketType" | "channel";

export interface SalesRow {
  key: string;
  ticketsSold: number;
  revenue: number;
}

export interface VisitorRow {
  day: string;
  sold: number;
  checkedIn: number;
  checkInRate: number;
}

export interface EventReportRow {
  eventId: number;
  eventName: string;
  eventType: string;
  schedulesRun: number;
  capacity: number;
  seatsSold: number;
  fillRate: number;
  revenue: number;
}

// ── Inputs ────────────────────────────────────────────────────────────────

export interface ParkTicketTypeInput {
  name: string;
  price: string;
}

export interface ParkEventInput {
  name: string;
  description: string;
  eventType: EventType;
  locationType: LocationType;
  basePrice: string;
  isActive?: boolean;
}

export interface EventScheduleInput {
  eventId: number;
  startAt: string;
  capacity: number;
}

/** Walk-up sale: `name`/`email` find-or-create the customer's visitor account. */
export interface GateSaleInput {
  ticketTypeId: number;
  visitDate: string;
  quantity: number;
  name: string;
  email: string;
}

export interface ParkDayInput {
  capacity: number;
  isClosed?: boolean;
  note?: string;
}
