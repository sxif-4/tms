export type RoomStatus =
  | "available"
  | "occupied"
  | "maintenance"
  | "out_of_service";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

/** Staff-facing hotel access, scoped to the caller's assigned hotels. */
export interface Hotel {
  id: number;
  name: string;
  description: string | null;
  mapLocationId: number | null;
  maxRooms: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomTypeAmenity {
  id: number;
  name: string;
  icon: string | null;
  category: string;
}

/** Global room-type catalog, shared across all hotels. */
export interface RoomType {
  id: number;
  name: string;
  description: string;
  /** Decimal as text, e.g. "120.00". */
  basePricePerNight: string;
  maxOccupancy: number;
  createdAt: string;
  updatedAt: string;
  /** Seeded amenities linked via room_type_amenities (read-only in staff UI). */
  amenities?: RoomTypeAmenity[];
  /** First linked room_type imageable URL, if any. */
  image?: string | null;
  images?: string[];
}

export interface Room {
  id: number;
  hotelId: number;
  roomTypeId: number;
  roomNumber: string;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

/** List/detail row shape returned by the API — never includes extra guest PII beyond name/email. */
export interface HotelBooking {
  id: number;
  bookingReference: string;
  userId: number;
  guestName: string;
  guestEmail: string;
  hotelId: number;
  hotelName: string;
  roomTypeId: number;
  roomTypeName: string;
  roomId: number | null;
  roomNumber: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RevenuePoint {
  day: string;
  revenue: number;
}

export interface OccupancyPoint {
  day: string;
  occupiedRoomNights: number;
  totalRooms: number;
  occupancyRate: number;
}

export interface UnassignedBookingRow {
  id: number;
  bookingReference: string;
  checkIn: number;
  roomTypeName: string;
  guests: number;
}

export interface PendingBookingRow {
  id: number;
  bookingReference: string;
  checkIn: number;
  roomTypeName: string;
  totalAmount: string;
}

export interface MaintenanceRoomRow {
  id: number;
  roomNumber: string;
  status: string;
  roomTypeName: string;
}

export interface DaySheetRow {
  id: number;
  bookingReference: string;
  guestName: string;
  roomTypeName: string;
  roomNumber: string | null;
  guests: number;
  status: string;
}

export interface HotelDashboardResponse {
  hotelId: number;
  kpis: {
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    revenueLast30Days: number;
    activeBookings: number;
  };
  revenueTrend: RevenuePoint[];
  priorityActions: {
    unassignedUpcoming: { total: number; items: UnassignedBookingRow[] };
    pendingConfirmations: { total: number; items: PendingBookingRow[] };
    roomsInMaintenance: { total: number; items: MaintenanceRoomRow[] };
  };
  todaysArrivals: DaySheetRow[];
  todaysDepartures: DaySheetRow[];
}

export interface RoomTypeInput {
  name: string;
  description: string;
  basePricePerNight: string;
  maxOccupancy: number;
}

export interface RoomInput {
  hotelId: number;
  roomTypeId: number;
  roomNumber: string;
  status?: RoomStatus;
}
