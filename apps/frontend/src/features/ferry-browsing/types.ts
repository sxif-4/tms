import type { FerryBooking } from "~/features/ferry/bookings-types";

export type { FerryBooking, FerryPass } from "~/features/ferry/bookings-types";

/** A sailing as visitors see it — with live availability, not raw capacity. */
export type BookableSailing = {
  id: number;
  routeId: number;
  routeName: string;
  origin: string;
  destination: string;
  departureAt: string;
  direction: FerryBooking["direction"];
  status: "scheduled" | "departed" | "cancelled";
  capacity: number;
  basePrice: string;
  booked: number;
  remainingSeats: number;
};

/** A stay the visitor could travel on. */
export type EligibleStay = {
  id: number;
  bookingReference: string;
  hotelId: number;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};
