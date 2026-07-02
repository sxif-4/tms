import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ferryRoutes } from './ferry-routes.schema';

export const ferrySchedules = sqliteTable(
  'ferry_schedules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    routeId: integer('route_id')
      .notNull()
      .references(() => ferryRoutes.id),
    departureAt: integer('departure_at', { mode: 'timestamp' }).notNull(),
    direction: text('direction', {
      enum: ['to_theme_park', 'to_island'],
    }).notNull(),
    capacity: integer('capacity').notNull(),
    // decimal(10,2) as text — exact money, never float.
    basePrice: text('base_price').notNull(),
    status: text('status', {
      enum: ['scheduled', 'departed', 'cancelled'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('ferry_schedules_route_id_idx').on(t.routeId),
    index('ferry_schedules_departure_at_idx').on(t.departureAt),
  ],
);

export type FerrySchedule = typeof ferrySchedules.$inferSelect;
export type NewFerrySchedule = typeof ferrySchedules.$inferInsert;
