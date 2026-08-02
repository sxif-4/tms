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
 * Property-level features (pool, gym, restaurant), as distinct from
 * `amenities`, which describe what's inside a room. Kept as a separate
 * taxonomy so the room-type picker never offers "Rooftop Pool".
 */
export const facilities = sqliteTable(
  'facilities',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    /** Optional lucide-style icon key, e.g. `dumbbell`, `utensils`. */
    icon: text('icon'),
    category: text('category', {
      enum: ['wellness', 'dining', 'services', 'recreation', 'transport'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex('facilities_name_unique').on(t.name)],
);

/** Junction: which facilities a hotel offers. */
export const hotelFacilities = sqliteTable(
  'hotel_facilities',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    hotelId: integer('hotel_id')
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    facilityId: integer('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'cascade' }),
  },
  (t) => [
    uniqueIndex('hotel_facilities_unique').on(t.hotelId, t.facilityId),
    index('hotel_facilities_hotel_id_idx').on(t.hotelId),
  ],
);

export type Facility = typeof facilities.$inferSelect;
export type NewFacility = typeof facilities.$inferInsert;
export type HotelFacility = typeof hotelFacilities.$inferSelect;
export type NewHotelFacility = typeof hotelFacilities.$inferInsert;
