/**
 * Visitor-facing park shapes. The `/public/park/*` endpoints deliberately
 * return narrower rows than the staff API — no buyer names, emails, ticket
 * references, capacity or takings — so these are their own types rather than
 * `Partial<>` of the staff ones in `~/features/park/types`.
 *
 * Money arrives as decimal text ("75.00"), never a float. Timestamps arrive as
 * ISO strings; `date` fields on park days are `yyyy-MM-dd` calendar keys.
 */

import type {
  EventType,
  LocationType,
  ParkTicket,
  EventBooking,
} from "~/features/park/types";

export type { EventType, LocationType, ParkTicket, EventBooking };

/** `GET /public/park/ticket-types` */
export interface PublicTicketType {
  id: number;
  name: string;
  /** Decimal as text, e.g. "75.00". */
  price: string;
}

/** `GET /public/park/events` — active events only. */
export interface PublicEvent {
  id: number;
  name: string;
  description: string;
  eventType: EventType;
  locationType: LocationType;
  basePrice: string;
}

/** One upcoming run of an event. `remaining` is computed, never stored. */
export interface PublicSchedule {
  id: number;
  startAt: string;
  capacity: number;
  remaining: number;
}

/** `GET /public/park/events/:id` */
export interface PublicEventDetail extends PublicEvent {
  schedules: PublicSchedule[];
}

/**
 * One day in the ticket date picker. Narrowed from the staff calendar: a
 * visitor sees what's left and whether the park is shut, not its capacity.
 */
export interface PublicDayAvailability {
  /** `yyyy-MM-dd`. */
  date: string;
  remaining: number;
  isClosed: boolean;
}

export interface PublicEventFilters {
  eventType?: EventType;
  locationType?: LocationType;
}

/** Body of `POST /park-tickets` — the buyer is taken from the JWT. */
export interface PurchaseParkTicketInput {
  ticketTypeId: number;
  /** `yyyy-MM-dd`; the API normalises it to UTC midnight. */
  visitDate: string;
  quantity: number;
}

/** Body of `POST /event-bookings` — the park ticket is the prerequisite. */
export interface CreateEventBookingInput {
  eventScheduleId: number;
  parkTicketId: number;
  quantity: number;
}
