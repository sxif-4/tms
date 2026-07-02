import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { events } from './events.schema';

export const eventSchedules = sqliteTable(
  'event_schedules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    eventId: integer('event_id')
      .notNull()
      .references(() => events.id),
    startAt: integer('start_at', { mode: 'timestamp' }).notNull(),
    capacity: integer('capacity').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('event_schedules_event_id_idx').on(t.eventId),
    index('event_schedules_start_at_idx').on(t.startAt),
  ],
);

export type EventSchedule = typeof eventSchedules.$inferSelect;
export type NewEventSchedule = typeof eventSchedules.$inferInsert;
