import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, ne } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  hotelBookings,
  rooms,
  type NewRoom,
  type Room,
} from '../../shared/database/schema';

/** Sole owner of Drizzle queries for rooms. */
@Injectable()
export class RoomsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAllByHotel(hotelId: number): Promise<Room[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(rooms)
        .where(eq(rooms.hotelId, hotelId))
        .orderBy(asc(rooms.roomNumber))
        .all(),
    );
  }

  findById(id: number): Promise<Room | undefined> {
    return Promise.resolve(
      this.db.select().from(rooms).where(eq(rooms.id, id)).get(),
    );
  }

  create(data: NewRoom): Promise<Room> {
    return Promise.resolve(
      this.db.insert(rooms).values(data).returning().get(),
    );
  }

  update(id: number, data: Partial<NewRoom>): Promise<Room | undefined> {
    return Promise.resolve(
      this.db
        .update(rooms)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(rooms.id, id))
        .returning()
        .get(),
    );
  }

  delete(id: number): Promise<void> {
    this.db.delete(rooms).where(eq(rooms.id, id)).run();
    return Promise.resolve();
  }

  /** True if this room is assigned to an active (non-cancelled/completed) booking. */
  hasActiveBookings(roomId: number): Promise<boolean> {
    const row = this.db
      .select({ id: hotelBookings.id })
      .from(hotelBookings)
      .where(
        and(
          eq(hotelBookings.roomId, roomId),
          ne(hotelBookings.status, 'cancelled'),
          ne(hotelBookings.status, 'completed'),
        ),
      )
      .get();
    return Promise.resolve(!!row);
  }
}
