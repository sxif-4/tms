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
  /** Suspended hotels are hidden from visitors and take no new bookings. */
  isActive: boolean;
  /** Only returned by the staff/admin hotel endpoints. */
  facilities?: Facility[];
  /** Cover photo, or `null` until one's uploaded. */
  image?: string | null;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

/** Property-level feature (pool, gym) — distinct from per-room amenities. */
export interface Facility {
  id: number;
  name: string;
  icon: string | null;
  category: string;
}

/** A gallery image with the metadata the Media card needs to manage it. */
export interface RoomTypeImage {
  id: number;
  url: string;
  isCover: boolean;
  sortOrder: number;
}

export interface RoomTypeAmenity {
  id: number;
  name: string;
  icon: string | null;
  category: string;
}

/** Room types belong to one hotel — two hotels' "Beach Villa" are separate records. */
export interface RoomType {
  id: number;
  hotelId: number;
  name: string;
  description: string;
  /** Decimal as text, e.g. "120.00". */
  basePricePerNight: string;
  maxOccupancy: number;
  createdAt: string;
  updatedAt: string;
  /** Physical-room counts, matching the dashboard's `rooms.status` definition. */
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  outOfServiceRooms: number;
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
