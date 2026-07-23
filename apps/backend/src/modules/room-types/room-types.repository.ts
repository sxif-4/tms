import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
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

export interface RoomTypeAmenityDto {
  id: number;
  name: string;
  icon: string | null;
  category: string;
}

export type RoomTypeWithAmenities = RoomType & {
  amenities: RoomTypeAmenityDto[];
  image: string | null;
  images: string[];
};

/** Sole owner of Drizzle queries for the global room-type catalog. */
@Injectable()
export class RoomTypesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private amenitiesForRoomTypes(
    roomTypeIds: number[],
  ): Map<number, RoomTypeAmenityDto[]> {
    const map = new Map<number, RoomTypeAmenityDto[]>();
    if (roomTypeIds.length === 0) return map;

    const rows = this.db.all<RoomTypeAmenityDto & { roomTypeId: number }>(sql`
      SELECT rta.room_type_id AS roomTypeId, a.id, a.name, a.icon, a.category
      FROM room_type_amenities rta
      JOIN amenities a ON a.id = rta.amenity_id
      WHERE rta.room_type_id IN (${sql.join(
        roomTypeIds.map((id) => sql`${id}`),
        sql`, `,
      )})
      ORDER BY a.category, a.name
    `);

    for (const row of rows) {
      const list = map.get(row.roomTypeId) ?? [];
      list.push({
        id: row.id,
        name: row.name,
        icon: row.icon,
        category: row.category,
      });
      map.set(row.roomTypeId, list);
    }
    return map;
  }

  private imagesForRoomTypes(roomTypeIds: number[]): Map<number, string[]> {
    const map = new Map<number, string[]>();
    if (roomTypeIds.length === 0) return map;
    const rows = this.db.all<{ roomTypeId: number; url: string }>(sql`
      SELECT im.imageable_id AS roomTypeId, i.url
      FROM imageables im
      JOIN images i ON i.id = im.image_id
      WHERE im.imageable_type = 'room_type'
        AND im.imageable_id IN (${sql.join(
          roomTypeIds.map((id) => sql`${id}`),
          sql`, `,
        )})
    `);
    for (const row of rows) {
      const list = map.get(row.roomTypeId) ?? [];
      list.push(row.url);
      map.set(row.roomTypeId, list);
    }
    return map;
  }

  private withAmenities(rows: RoomType[]): RoomTypeWithAmenities[] {
    const ids = rows.map((r) => r.id);
    const amenitiesByType = this.amenitiesForRoomTypes(ids);
    const imagesByType = this.imagesForRoomTypes(ids);
    return rows.map((rt) => {
      const imgs = imagesByType.get(rt.id) ?? [];
      return {
        ...rt,
        amenities: amenitiesByType.get(rt.id) ?? [],
        image: imgs[0] ?? null,
        images: imgs,
      };
    });
  }

  findAll(): Promise<RoomTypeWithAmenities[]> {
    const rows = this.db
      .select()
      .from(roomTypes)
      .orderBy(asc(roomTypes.name))
      .all();
    return Promise.resolve(this.withAmenities(rows));
  }

  findById(id: number): Promise<RoomTypeWithAmenities | undefined> {
    const row = this.db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.id, id))
      .get();
    if (!row) return Promise.resolve(undefined);
    return Promise.resolve(this.withAmenities([row])[0]);
  }

  create(data: NewRoomType): Promise<RoomTypeWithAmenities> {
    const created = this.db.insert(roomTypes).values(data).returning().get();
    return Promise.resolve({
      ...created,
      amenities: [],
      image: null,
      images: [],
    });
  }

  update(
    id: number,
    data: Partial<NewRoomType>,
  ): Promise<RoomTypeWithAmenities | undefined> {
    const updated = this.db
      .update(roomTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roomTypes.id, id))
      .returning()
      .get();
    if (!updated) return Promise.resolve(undefined);
    return this.findById(id);
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
