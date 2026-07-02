import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ferrySchedules } from './ferry-schedules.schema';
import { hotelBookings } from './hotel-bookings.schema';
import { users } from './users.schema';

export const ferryBookings = sqliteTable(
  'ferry_bookings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    bookingReference: text('booking_reference').notNull().unique(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    scheduleId: integer('schedule_id')
      .notNull()
      .references(() => ferrySchedules.id),
    // Enforces the valid-stay rule: a ferry booking needs a hotel booking.
    hotelBookingId: integer('hotel_booking_id')
      .notNull()
      .references(() => hotelBookings.id),
    passengerCount: integer('passenger_count').notNull(),
    // decimal(10,2) as text — price snapshot at booking time, never float.
    totalAmount: text('total_amount').notNull(),
    validatedBy: integer('validated_by').references(() => users.id),
    validatedAt: integer('validated_at', { mode: 'timestamp' }),
    status: text('status', {
      enum: ['pending', 'confirmed', 'cancelled', 'validated'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('ferry_bookings_user_id_idx').on(t.userId),
    index('ferry_bookings_schedule_id_idx').on(t.scheduleId),
    index('ferry_bookings_hotel_booking_id_idx').on(t.hotelBookingId),
  ],
);

export type FerryBooking = typeof ferryBookings.$inferSelect;
export type NewFerryBooking = typeof ferryBookings.$inferInsert;
