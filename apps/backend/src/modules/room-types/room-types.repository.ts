import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  rooms,
  roomTypes,
  type NewRoomType,
  type RoomType,
} from '../../shared/database/schema';

/** Sole owner of Drizzle queries for the global room-type catalog. */
@Injectable()
export class RoomTypesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(): Promise<RoomType[]> {
    return Promise.resolve(
      this.db.select().from(roomTypes).orderBy(asc(roomTypes.name)).all(),
    );
  }

  findById(id: number): Promise<RoomType | undefined> {
    return Promise.resolve(
      this.db.select().from(roomTypes).where(eq(roomTypes.id, id)).get(),
    );
  }

  create(data: NewRoomType): Promise<RoomType> {
    return Promise.resolve(
      this.db.insert(roomTypes).values(data).returning().get(),
    );
  }

  update(
    id: number,
    data: Partial<NewRoomType>,
  ): Promise<RoomType | undefined> {
    return Promise.resolve(
      this.db
        .update(roomTypes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(roomTypes.id, id))
        .returning()
        .get(),
    );
  }

  delete(id: number): Promise<void> {
    this.db.delete(roomTypes).where(eq(roomTypes.id, id)).run();
    return Promise.resolve();
  }

  /** Distinct hotel IDs with at least one room of this type — used to guard cross-hotel edits. */
  hotelIdsUsingRoomType(roomTypeId: number): Promise<number[]> {
    const rows = this.db
      .selectDistinct({ hotelId: rooms.hotelId })
      .from(rooms)
      .where(eq(rooms.roomTypeId, roomTypeId))
      .all();
    return Promise.resolve(rows.map((r) => r.hotelId));
  }
}
