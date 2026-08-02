import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { hotels } from './hotels.schema';

/**
 * Room types belong to a single hotel, mirroring how real property management
 * systems work: two hotels may both sell a "Beach Villa", but they are separate
 * records with their own price, description and amenities. Rooms of a given
 * type must live at the same hotel — enforced in the service layer.
 */
export const roomTypes = sqliteTable(
  'room_types',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    hotelId: integer('hotel_id')
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    // decimal(10,2) as text — exact money, never float.
    basePricePerNight: text('base_price_per_night').notNull(),
    maxOccupancy: integer('max_occupancy').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex('room_types_hotel_id_name_unique').on(t.hotelId, t.name),
    index('room_types_hotel_id_idx').on(t.hotelId),
  ],
);

export type RoomType = typeof roomTypes.$inferSelect;
export type NewRoomType = typeof roomTypes.$inferInsert;
