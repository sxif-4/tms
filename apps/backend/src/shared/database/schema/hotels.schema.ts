import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { mapLocations } from './map-locations.schema';

export const hotels = sqliteTable(
  'hotels',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    mapLocationId: integer('map_location_id').references(() => mapLocations.id),
    maxRooms: integer('max_rooms').notNull(),
    /**
     * Admin can suspend a hotel without deleting it: suspended hotels vanish
     * from visitor browsing and reject new bookings, but existing bookings and
     * their price snapshots survive, and assigned staff keep access so they
     * can see out the guests already booked in.
     */
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('hotels_map_location_id_idx').on(t.mapLocationId)],
);

export type Hotel = typeof hotels.$inferSelect;
export type NewHotel = typeof hotels.$inferInsert;
