import { type AssignedHotel } from '../user-assignments.repository';
import { UserWithRole } from '../users.repository';

/**
 * Safe public shape of a user. Fields are assigned explicitly so the
 * password hash can never leak, regardless of serializer configuration.
 */
export class UserResponseDto {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  /**
   * Hotels a `hotel_staff` account is scoped to — an empty array means the
   * account can't reach any hotel data yet, which the admin UI flags. Only the
   * admin user endpoints load this; it is omitted entirely elsewhere (e.g. the
   * auth responses) rather than serialised as a misleading empty array.
   */
  assignedHotels?: AssignedHotel[];

  constructor(user: UserWithRole, assignedHotels?: AssignedHotel[]) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    if (assignedHotels) this.assignedHotels = assignedHotels;
  }
}
