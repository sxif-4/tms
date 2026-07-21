export interface HotelSummary {
  id: number;
  name: string;
  description: string | null;
  positionTop: string | null;
  positionLeft: string | null;
  minPrice: number | null;
  image: string | null;
  /** Total hotel gallery images; used for browse-card photo-count badge. */
  imageCount?: number;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string | null;
  category: string;
}

export interface RoomType {
  id: number;
  name: string;
  description: string;
  basePricePerNight: string;
  maxOccupancy: number;
  totalRooms: number;
  image?: string | null;
  images?: string[];
  amenities?: Amenity[];
}

export interface HotelDetail extends HotelSummary {
  maxRooms: number;
  images: string[];
  roomTypes: RoomType[];
}

export interface RoomTypeAvailability {
  roomTypeId: number;
  name: string;
  description: string;
  basePricePerNight: string;
  maxOccupancy: number;
  totalRooms: number;
  availableRooms: number;
  nights: number;
  totalPrice: number;
  image?: string | null;
  images?: string[];
  amenities?: Amenity[];
}

export type AvailabilityLevel = "none" | "low" | "medium" | "high";

export interface DayAvailability {
  date: string;
  totalRooms: number;
  availableRooms: number;
  level: AvailabilityLevel;
}

export type HotelBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

/** Mirrors the backend's `HotelBookingRow` — returned by both `POST /hotel-bookings` and `GET /hotel-bookings/mine`. */
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
  status: HotelBookingStatus;
  createdAt: string;
  updatedAt: string;
}

/** Alias kept for readability at visitor "My Bookings" call sites. */
export type MyBooking = HotelBooking;

export interface HotelFilters {
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
}
