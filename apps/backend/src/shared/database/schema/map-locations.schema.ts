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
  // decimal(5,2) stored as text — percentage position over the static island
  // image (0-100), never float-coerced. Replaces real-world GPS coordinates:
  // this is a fictional island rendered as one fixed illustration, not a
  // real place, so pins are positioned relative to the image instead.
  positionTop: text('position_top').notNull(),
  positionLeft: text('position_left').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type MapLocation = typeof mapLocations.$inferSelect;
export type NewMapLocation = typeof mapLocations.$inferInsert;
