export interface Overview {
  totalUsers: number;
  activeBookings: number;
  revenue: number;
  ticketsSold: number;
}

export interface SalesPoint {
  date: string;
  hotel: number;
  ferry: number;
  park: number;
  event: number;
}

export interface UsagePoint {
  domain: "ferry" | "event";
  capacity: number;
  booked: number;
  utilization: number;
}

/** Operational snapshot behind the overview's attention tiles. */
export interface Operations {
  arrivalsToday: number;
  departuresToday: number;
  inHouse: number;
  unassignedRooms: number;
  pendingPaymentCount: number;
  pendingPaymentAmount: number;
  refundedCount: number;
  refundedAmount: number;
}

/** One hotel's forward occupancy over the next 30 days. */
export interface OccupancyPoint {
  hotelId: number;
  hotelName: string;
  rooms: number;
  roomNightsBooked: number;
  roomNightsAvailable: number;
  occupancy: number;
}

/** An upcoming sailing or event and how full it is. */
export interface ScheduleFillPoint {
  domain: "ferry" | "event";
  id: number;
  label: string;
  detail: string;
  startAt: string;
  capacity: number;
  booked: number;
  fillRate: number;
}
