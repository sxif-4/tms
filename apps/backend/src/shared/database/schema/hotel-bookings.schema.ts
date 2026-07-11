import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { hotels } from './hotels.schema';
import { roomTypes } from './room-types.schema';
import { rooms } from './rooms.schema';
import { users } from './users.schema';

export const hotelBookings = sqliteTable(
  'hotel_bookings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    bookingReference: text('booking_reference').notNull().unique(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    // Room-type-first booking: the visitor picks a hotel + room type + dates;
    // staff assign the actual physical room before check-in. `roomId` stays
    // null until assigned — a valid, tracked "unassigned" operational state.
    hotelId: integer('hotel_id')
      .notNull()
      .references(() => hotels.id),
    roomTypeId: integer('room_type_id')
      .notNull()
      .references(() => roomTypes.id),
    roomId: integer('room_id').references(() => rooms.id),
    checkIn: integer('check_in', { mode: 'timestamp' }).notNull(),
    checkOut: integer('check_out', { mode: 'timestamp' }).notNull(),
    guests: integer('guests').notNull(),
    // decimal(10,2) as text — price snapshot at booking time, never float.
    totalAmount: text('total_amount').notNull(),
    status: text('status', {
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('hotel_bookings_user_id_idx').on(t.userId),
    index('hotel_bookings_hotel_id_idx').on(t.hotelId),
    index('hotel_bookings_room_type_id_idx').on(t.roomTypeId),
    index('hotel_bookings_room_id_idx').on(t.roomId),
    index('hotel_bookings_check_in_idx').on(t.checkIn),
    index('hotel_bookings_check_out_idx').on(t.checkOut),
  ],
);

export type HotelBooking = typeof hotelBookings.$inferSelect;
export type NewHotelBooking = typeof hotelBookings.$inferInsert;
