export type FerryRoute = {
  id: number;
  name: string;
  origin: string;
  destination: string;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
};

export type FerrySchedule = {
  id: number;
  routeId: number;
  departureAt: string | Date;
  direction: "to_theme_park" | "to_island";
  capacity: number;
  basePrice: string;
  status: "scheduled" | "departed" | "cancelled";
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
};

export type FerryBookingUser = {
  id: number;
  name: string;
  email: string;
};

export type FerryHotelBookingOption = {
  id: number;
  bookingReference: string;
  hotelId: number;
  hotelName: string;
  checkIn: string | Date;
  checkOut: string | Date;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};
