import { integer, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { amenities } from './amenities.schema';
import { roomTypes } from './room-types.schema';

/** Junction: which amenities a room type includes (rooms inherit via roomTypeId). */
export const roomTypeAmenities = sqliteTable(
  'room_type_amenities',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    roomTypeId: integer('room_type_id')
      .notNull()
      .references(() => roomTypes.id, { onDelete: 'cascade' }),
    amenityId: integer('amenity_id')
      .notNull()
      .references(() => amenities.id, { onDelete: 'cascade' }),
  },
  (t) => [
    uniqueIndex('room_type_amenities_unique').on(t.roomTypeId, t.amenityId),
  ],
);

export type RoomTypeAmenity = typeof roomTypeAmenities.$inferSelect;
export type NewRoomTypeAmenity = typeof roomTypeAmenities.$inferInsert;
