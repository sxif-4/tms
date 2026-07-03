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
