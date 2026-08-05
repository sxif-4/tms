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

export type FerryManifest = {
  schedule: {
    id: number;
    routeName: string;
    origin: string;
    destination: string;
    departureAt: string;
    direction: FerrySchedule["direction"];
    status: FerrySchedule["status"];
    capacity: number;
  };
  totals: {
    bookings: number;
    passengers: number;
    validated: number;
    remaining: number;
    loadFactor: number;
  };
};

export type FerrySalesRow = {
  key: string;
  bookings: number;
  passengers: number;
  revenue: number;
};

export type FerryTripRow = {
  scheduleId: number;
  routeId: number;
  routeName: string;
  departureAt: string;
  direction: FerrySchedule["direction"];
  status: FerrySchedule["status"];
  capacity: number;
  booked: number;
  validated: number;
  revenue: number;
  loadFactor: number;
  /** Null until the sailing has actually gone — see the backend service. */
  noShows: number | null;
};

export type FerryRouteReportRow = {
  routeId: number;
  routeName: string;
  sailings: number;
  capacity: number;
  passengers: number;
  revenue: number;
  averageLoad: number;
};

export type FerryDashboard = {
  stats: {
    pendingPasses: number;
    todaysDepartures: number;
    boardedToday: number;
    todaysFill: {
      booked: number;
      capacity: number;
      remaining: number;
      fillRate: number;
    };
  };
  nextSailings: {
    id: number;
    routeId: number;
    routeName: string;
    departureAt: string;
    direction: FerrySchedule["direction"];
    status: FerrySchedule["status"];
    capacity: number;
    booked: number;
  }[];
  routeOccupancy: {
    routeId: number;
    routeName: string;
    sailings: number;
    capacity: number;
    booked: number;
    occupancyRate: number;
  }[];
  recentRequests: {
    id: number;
    bookingReference: string;
    guestName: string;
    status: "pending" | "confirmed" | "cancelled" | "validated";
    passengerCount: number;
    createdAt: string;
    routeName: string;
    departureAt: string;
    hotelStatus: "pending" | "confirmed" | "cancelled" | "completed";
  }[];
};
