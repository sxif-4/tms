import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.constants';
import { userAssignments } from '../database/schema';
import { Role } from '../enums/role.enum';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Restricts `hotel_staff` to the hotels they're assigned to via
 * `user_assignments` (assignable_type = 'hotel'). Admins bypass every check.
 * The sole owner of "who can touch which hotel" logic — every hotel-domain
 * module (hotels, room types, rooms, bookings, dashboard, reports,
 * promotions) should go through this rather than re-deriving scope.
 */
@Injectable()
export class HotelAccessService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Hotel IDs the user may act on, or `'all'` for admins. */
  async scopedHotelIds(user: AuthenticatedUser): Promise<number[] | 'all'> {
    if (user.role === Role.Admin) return 'all';
    const rows = this.db
      .select({ hotelId: userAssignments.assignableId })
      .from(userAssignments)
      .where(
        and(
          eq(userAssignments.userId, user.id),
          eq(userAssignments.assignableType, 'hotel'),
        ),
      )
      .all();
    return Promise.resolve(rows.map((r) => r.hotelId));
  }

  /** Throws 403 unless the user may act on `hotelId` (admins always may). */
  async assertHotelAccess(
    user: AuthenticatedUser,
    hotelId: number,
  ): Promise<void> {
    const scope = await this.scopedHotelIds(user);
    if (scope === 'all') return;
    if (!scope.includes(hotelId)) {
      throw new ForbiddenException('You are not assigned to this hotel');
    }
  }
}
