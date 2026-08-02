export type Role =
  | "visitor"
  | "hotel_staff"
  | "ferry_staff"
  | "park_staff"
  | "admin";

/** A hotel a `hotel_staff` account is scoped to via `user_assignments`. */
export interface AssignedHotel {
  assignmentId: number;
  hotelId: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  /**
   * Only sent by the admin user endpoints — absent on auth/session responses.
   * An empty array means a hotel staff account has no hotel scope yet.
   */
  assignedHotels?: AssignedHotel[];
}

/** Auth endpoints return only the user; tokens live in httpOnly cookies. */
export interface SessionResponse {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
