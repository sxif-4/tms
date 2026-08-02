import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  hotels,
  type UserAssignment,
  userAssignments,
} from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';

/** A hotel a staff member is scoped to, joined with the hotel's name. */
export interface AssignedHotel {
  assignmentId: number;
  hotelId: number;
  name: string;
}

/**
 * Sole owner of Drizzle queries for `user_assignments`. Reads for authorisation
 * go through `HotelAccessService`; this repository owns the admin-facing
 * reads/writes behind `/users/:userId/hotels`.
 */
@Injectable()
export class UserAssignmentsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findHotelsForUser(userId: number): Promise<AssignedHotel[]> {
    const rows = this.db
      .select({
        assignmentId: userAssignments.id,
        hotelId: hotels.id,
        name: hotels.name,
      })
      .from(userAssignments)
      .innerJoin(hotels, eq(hotels.id, userAssignments.assignableId))
      .where(
        and(
          eq(userAssignments.userId, userId),
          eq(userAssignments.assignableType, 'hotel'),
        ),
      )
      .orderBy(asc(hotels.name))
      .all();
    return Promise.resolve(rows);
  }

  /**
   * Batch variant for the admin user grid — one query for every user on the
   * page rather than one per card.
   */
  findHotelsForUsers(userIds: number[]): Promise<Map<number, AssignedHotel[]>> {
    const grouped = new Map<number, AssignedHotel[]>();
    if (userIds.length === 0) return Promise.resolve(grouped);

    const rows = this.db
      .select({
        userId: userAssignments.userId,
        assignmentId: userAssignments.id,
        hotelId: hotels.id,
        name: hotels.name,
      })
      .from(userAssignments)
      .innerJoin(hotels, eq(hotels.id, userAssignments.assignableId))
      .where(
        and(
          inArray(userAssignments.userId, userIds),
          eq(userAssignments.assignableType, 'hotel'),
        ),
      )
      .orderBy(asc(hotels.name))
      .all();

    for (const { userId, ...hotel } of rows) {
      const existing = grouped.get(userId);
      if (existing) existing.push(hotel);
      else grouped.set(userId, [hotel]);
    }
    return Promise.resolve(grouped);
  }

  hotelAssignmentExists(userId: number, hotelId: number): Promise<boolean> {
    const row = this.db
      .select({ id: userAssignments.id })
      .from(userAssignments)
      .where(
        and(
          eq(userAssignments.userId, userId),
          eq(userAssignments.assignableType, 'hotel'),
          eq(userAssignments.assignableId, hotelId),
        ),
      )
      .get();
    return Promise.resolve(!!row);
  }

  assignHotel(userId: number, hotelId: number): Promise<UserAssignment> {
    return Promise.resolve(
      this.db
        .insert(userAssignments)
        .values({ userId, assignableType: 'hotel', assignableId: hotelId })
        .returning()
        .get(),
    );
  }

  /** Returns false when the user wasn't assigned to that hotel to begin with. */
  deleteHotelAssignment(userId: number, hotelId: number): Promise<boolean> {
    const removed = this.db
      .delete(userAssignments)
      .where(
        and(
          eq(userAssignments.userId, userId),
          eq(userAssignments.assignableType, 'hotel'),
          eq(userAssignments.assignableId, hotelId),
        ),
      )
      .returning()
      .all();
    return Promise.resolve(removed.length > 0);
  }

  /**
   * Drops assignments the user's new role can no longer act on. `hotel_staff`
   * keeps its hotel rows; every other role keeps none — hotels are the only
   * assignment-scoped domain, since ferry and park staff are authorised by
   * role alone. Without this, demoting and re-promoting a user would silently
   * restore their old hotel access.
   */
  deleteInvalidForRole(userId: number, role: Role): Promise<void> {
    const scope =
      role === Role.HotelStaff
        ? and(
            eq(userAssignments.userId, userId),
            ne(userAssignments.assignableType, 'hotel'),
          )
        : eq(userAssignments.userId, userId);

    this.db.delete(userAssignments).where(scope).run();
    return Promise.resolve();
  }
}
