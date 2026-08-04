export type RoomStatus =
  | "available"
  | "occupied"
  | "maintenance"
  | "out_of_service";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type BookingChannel = "online" | "staff";

/** Staff open a desk booking either unpaid or paid on the spot. */
export type ManualBookingStatus = "pending" | "confirmed";

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
  /** `staff` when taken at the front desk, `online` when the guest booked it. */
  channel: BookingChannel;
  /** Staff member who took a desk booking; null for online ones. */
  soldByUserId: number | null;
  source: BookingSource | null;
  arrivalTime: string | null;
  specialRequests: string | null;
  /** Staff-only — never shown to the guest. */
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Fields the desk collects that the visitor flow gets from the session. */
export interface ManualBookingInput {
  hotelId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  name: string;
  email: string;
  phone?: string;
  roomId?: number;
  status: ManualBookingStatus;
  paymentMethod?: PaymentMethod;
  source?: BookingSource;
  arrivalTime?: string;
  specialRequests?: string;
  internalNotes?: string;
}

export type PaymentMethod = "cash" | "card" | "bank_transfer";

export type BookingSource = "walk_in" | "phone" | "email" | "corporate" | "ota";

/** One room type's inventory position for the stay the desk is quoting. */
export interface RoomTypeAvailability {
  roomTypeId: number;
  name: string;
  basePricePerNight: string;
  maxOccupancy: number;
  /** Cover photo, or null if the room type has none. */
  image: string | null;
  /** Sellable rooms of this type — out-of-service ones are already excluded. */
  totalRooms: number;
  /** Held by overlapping bookings, whether or not a room was assigned yet. */
  bookedRooms: number;
  /** Rooms free for the whole stay, safe to hand out at check-in. */
  freeRooms: { id: number; roomNumber: string }[];
}

/** A guest the desk can attach a booking to, with their history at this hotel. */
export interface GuestSearchResult {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  /** Non-cancelled stays here — how the desk spots a regular. */
  stays: number;
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
