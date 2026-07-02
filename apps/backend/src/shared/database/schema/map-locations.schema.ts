import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const mapLocations = sqliteTable('map_locations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: text('type', {
    enum: [
      'hotel',
      'ferry_terminal',
      'attraction',
      'beach',
      'restaurant',
      'landmark',
    ],
  }).notNull(),
  // decimal(10,7) stored as text — exact coordinates, never float-coerced.
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type MapLocation = typeof mapLocations.$inferSelect;
export type NewMapLocation = typeof mapLocations.$inferInsert;
