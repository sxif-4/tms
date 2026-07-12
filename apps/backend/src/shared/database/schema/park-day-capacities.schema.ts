import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Per-day override of how many park tickets may be sold. A missing row means
// "default capacity" (PARK_DEFAULT_DAILY_CAPACITY), NOT "closed" — staff only
// insert a row to cap a day, raise it, or shut the park.
export const parkDayCapacities = sqliteTable('park_day_capacities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Normalise to UTC midnight on write, so the unique constraint and lookups
  // line up with park_tickets.visit_date.
  date: integer('date', { mode: 'timestamp' }).notNull().unique(),
  capacity: integer('capacity').notNull(),
  isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type ParkDayCapacity = typeof parkDayCapacities.$inferSelect;
export type NewParkDayCapacity = typeof parkDayCapacities.$inferInsert;
