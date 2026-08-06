/** A customer row in the admin search results. */
export interface CustomerSearchResult {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  /** Live bookings across every domain. */
  bookingCount: number;
}

export type HotelBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
export type FerryBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "validated";
export type EventBookingStatus = "pending" | "confirmed" | "cancelled";
export type ParkTicketStatus = "active" | "used" | "cancelled" | "refunded";

export interface CustomerHotelBooking {
  id: number;
  bookingReference: string;
  hotelName: string;
  roomTypeName: string;
  roomNumber: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: string;
  status: HotelBookingStatus;
  createdAt: string;
}

export interface CustomerFerryBooking {
  id: number;
  bookingReference: string;
  routeName: string;
  origin: string;
  destination: string;
  departureAt: string;
  passengerCount: number;
  totalAmount: string;
  status: FerryBookingStatus;
  /** The stay that authorises travel, when there is one. */
  hotelBookingId: number | null;
  createdAt: string;
}

export interface CustomerEventBooking {
  id: number;
  bookingReference: string;
  eventName: string;
  startAt: string;
  ticketReference: string;
  quantity: number;
  totalAmount: string;
  status: EventBookingStatus;
  createdAt: string;
}

export interface CustomerParkTicket {
  id: number;
  ticketReference: string;
  ticketTypeName: string;
  visitDate: string;
  quantity: number;
  totalAmount: string;
  status: ParkTicketStatus;
  createdAt: string;
}

export type PayableType =
  | "hotel_booking"
  | "ferry_booking"
  | "event_booking"
  | "park_ticket";

export interface CustomerPayment {
  id: number;
  payableType: PayableType;
  payableId: number;
  amount: string;
  status: "pending" | "completed" | "failed" | "refunded";
  method: "card" | "cash" | "bank_transfer";
  paymentReference: string;
  paidAt: string | null;
  createdAt: string;
  /** Reference of the booking this paid for. */
  payableReference: string | null;
}

export interface CustomerProfile {
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
  };
  hotelBookings: CustomerHotelBooking[];
  ferryBookings: CustomerFerryBooking[];
  eventBookings: CustomerEventBooking[];
  parkTickets: CustomerParkTicket[];
  payments: CustomerPayment[];
  totals: {
    lifetimeValue: string;
    refunded: string;
    liveBookings: number;
  };
}

/** Which domain a cancel action targets — picks the endpoint to call. */
export type BookingDomain = "hotel" | "ferry" | "event" | "park";
