import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { hotels } from './hotels.schema';
import { roomTypes } from './room-types.schema';

export const rooms = sqliteTable(
  'rooms',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    hotelId: integer('hotel_id')
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    roomTypeId: integer('room_type_id')
      .notNull()
      .references(() => roomTypes.id),
    roomNumber: text('room_number').notNull(),
    status: text('status', {
      enum: ['available', 'occupied', 'maintenance', 'out_of_service'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex('rooms_hotel_id_room_number_unique').on(
      t.hotelId,
      t.roomNumber,
    ),
    index('rooms_room_type_id_idx').on(t.roomTypeId),
  ],
);

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
