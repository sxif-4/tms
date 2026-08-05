/**
 * A booking as `GET /ferry/bookings` returns it — joined with the guest, the
 * sailing and the stay that authorises it, so the queue can show who is
 * travelling rather than just a reference.
 */
export type FerryBooking = {
  id: number;
  bookingReference: string;
  status: "pending" | "confirmed" | "cancelled" | "validated";
  passengerCount: number;
  totalAmount: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  validatedBy: number | null;
  validatedAt: string | Date | null;
  // guest
  userId: number;
  guestName: string;
  guestEmail: string;
  // sailing
  scheduleId: number;
  routeId: number;
  routeName: string;
  origin: string;
  destination: string;
  departureAt: string | Date;
  direction: "to_theme_park" | "to_island";
  scheduleStatus: "scheduled" | "departed" | "cancelled";
  capacity: number;
  basePrice: string;
  // the stay that authorises travel
  hotelBookingId: number;
  hotelUserId: number;
  hotelName: string;
  hotelBookingReference: string;
  hotelCheckIn: string | Date;
  hotelCheckOut: string | Date;
  hotelStatus: "pending" | "confirmed" | "cancelled" | "completed";
};

/** The guest-facing pass — what `GET /ferry/bookings/:id/pass` hands back. */
export type FerryPass = {
  bookingReference: string;
  status: FerryBooking["status"];
  guestName: string;
  passengerCount: number;
  totalAmount: string;
  routeName: string;
  origin: string;
  destination: string;
  departureAt: string | Date;
  direction: FerryBooking["direction"];
  hotelName: string;
  hotelBookingReference: string;
  issuedAt: string | Date | null;
  validatedAt: string | Date | null;
};
