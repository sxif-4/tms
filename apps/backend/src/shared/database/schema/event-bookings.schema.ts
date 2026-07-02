import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eventSchedules } from './event-schedules.schema';
import { parkTickets } from './park-tickets.schema';
import { users } from './users.schema';

export const eventBookings = sqliteTable(
  'event_bookings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    bookingReference: text('booking_reference').notNull().unique(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    eventScheduleId: integer('event_schedule_id')
      .notNull()
      .references(() => eventSchedules.id),
    // Enforces the ticket rule: an event booking needs a park ticket.
    parkTicketId: integer('park_ticket_id')
      .notNull()
      .references(() => parkTickets.id),
    quantity: integer('quantity').notNull(),
    // decimal(10,2) as text — price snapshot at booking time, never float.
    totalAmount: text('total_amount').notNull(),
    status: text('status', {
      enum: ['pending', 'confirmed', 'cancelled'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('event_bookings_user_id_idx').on(t.userId),
    index('event_bookings_event_schedule_id_idx').on(t.eventScheduleId),
    index('event_bookings_park_ticket_id_idx').on(t.parkTicketId),
  ],
);

export type EventBooking = typeof eventBookings.$inferSelect;
export type NewEventBooking = typeof eventBookings.$inferInsert;
