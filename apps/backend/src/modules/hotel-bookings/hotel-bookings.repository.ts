import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, gt, inArray, lt, ne, sql, type SQL } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  hotelBookings,
  hotels,
  payments,
  roomTypes,
  rooms,
  users,
  type HotelBooking,
  type NewHotelBooking,
} from '../../shared/database/schema';

export interface HotelBookingRow {
  id: number;
  bookingReference: string;
  userId: number;
  guestName: string;
  guestEmail: string;
  hotelId: number;
  hotelName: string;
  roomTypeId: number;
  roomTypeName: string;
  roomId: number | null;
  roomNumber: string | null;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const rowSelection = {
  id: hotelBookings.id,
  bookingReference: hotelBookings.bookingReference,
  userId: hotelBookings.userId,
  guestName: users.name,
  guestEmail: users.email,
  hotelId: hotelBookings.hotelId,
  hotelName: hotels.name,
  roomTypeId: hotelBookings.roomTypeId,
  roomTypeName: roomTypes.name,
  roomId: hotelBookings.roomId,
  roomNumber: rooms.roomNumber,
  checkIn: hotelBookings.checkIn,
  checkOut: hotelBookings.checkOut,
  guests: hotelBookings.guests,
  totalAmount: hotelBookings.totalAmount,
  status: hotelBookings.status,
  createdAt: hotelBookings.createdAt,
  updatedAt: hotelBookings.updatedAt,
} as const;

/** Sole owner of Drizzle queries for hotel bookings. */
@Injectable()
export class HotelBookingsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private joinedQuery() {
    return this.db
      .select(rowSelection)
      .from(hotelBookings)
      .innerJoin(users, eq(hotelBookings.userId, users.id))
      .innerJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
      .innerJoin(roomTypes, eq(hotelBookings.roomTypeId, roomTypes.id))
      .leftJoin(rooms, eq(hotelBookings.roomId, rooms.id));
  }

  findScoped(
    hotelIds: number[] | 'all',
    filters: { hotelId?: number; status?: string } = {},
  ): Promise<HotelBookingRow[]> {
    const conditions: SQL[] = [];
    if (hotelIds !== 'all') conditions.push(inArray(hotelBookings.hotelId, hotelIds));
    if (filters.hotelId) conditions.push(eq(hotelBookings.hotelId, filters.hotelId));
    if (filters.status)
      conditions.push(eq(hotelBookings.status, filters.status as HotelBooking['status']));

    const rows = (
      conditions.length
        ? this.joinedQuery().where(and(...conditions))
        : this.joinedQuery()
    )
      .orderBy(desc(hotelBookings.checkIn))
      .all();
    return Promise.resolve(rows as HotelBookingRow[]);
  }

  findByUserId(userId: number): Promise<HotelBookingRow[]> {
    const rows = this.joinedQuery()
      .where(eq(hotelBookings.userId, userId))
      .orderBy(desc(hotelBookings.checkIn))
      .all();
    return Promise.resolve(rows as HotelBookingRow[]);
  }

  findRowById(id: number): Promise<HotelBookingRow | undefined> {
    const row = this.joinedQuery().where(eq(hotelBookings.id, id)).get();
    return Promise.resolve(row as HotelBookingRow | undefined);
  }

  findRawById(id: number): Promise<HotelBooking | undefined> {
    return Promise.resolve(
      this.db.select().from(hotelBookings).where(eq(hotelBookings.id, id)).get(),
    );
  }

  create(data: NewHotelBooking): Promise<HotelBooking> {
    return Promise.resolve(
      this.db.insert(hotelBookings).values(data).returning().get(),
    );
  }

  updateRoomId(id: number, roomId: number): Promise<HotelBooking | undefined> {
    return Promise.resolve(
      this.db
        .update(hotelBookings)
        .set({ roomId, updatedAt: new Date() })
        .where(eq(hotelBookings.id, id))
        .returning()
        .get(),
    );
  }

  updateStatus(
    id: number,
    status: HotelBooking['status'],
  ): Promise<HotelBooking | undefined> {
    return Promise.resolve(
      this.db
        .update(hotelBookings)
        .set({ status, updatedAt: new Date() })
        .where(eq(hotelBookings.id, id))
        .returning()
        .get(),
    );
  }

  /** Total physical rooms of this type at this hotel — the availability ceiling. */
  countRoomsOfType(hotelId: number, roomTypeId: number): Promise<number> {
    const row = this.db.get<{ count: number }>(sql`
      SELECT COUNT(*) AS count FROM rooms
      WHERE hotel_id = ${hotelId} AND room_type_id = ${roomTypeId}
        AND status != 'out_of_service'
    `);
    return Promise.resolve(row?.count ?? 0);
  }

  /** Bookings of this hotel+room-type overlapping the date range (excludes cancelled). */
  countOverlapping(
    hotelId: number,
    roomTypeId: number,
    checkInSec: number,
    checkOutSec: number,
    excludeBookingId?: number,
  ): Promise<number> {
    const conditions = [
      eq(hotelBookings.hotelId, hotelId),
      eq(hotelBookings.roomTypeId, roomTypeId),
      ne(hotelBookings.status, 'cancelled'),
      lt(hotelBookings.checkIn, new Date(checkOutSec * 1000)),
      gt(hotelBookings.checkOut, new Date(checkInSec * 1000)),
    ];
    if (excludeBookingId) conditions.push(ne(hotelBookings.id, excludeBookingId));
    const rows = this.db
      .select({ id: hotelBookings.id })
      .from(hotelBookings)
      .where(and(...conditions))
      .all();
    return Promise.resolve(rows.length);
  }

  /** Inserts a completed mock payment for a freshly created booking. No real processor is wired up. */
  recordMockPayment(input: {
    userId: number;
    payableId: number;
    amount: string;
  }): Promise<void> {
    this.db
      .insert(payments)
      .values({
        userId: input.userId,
        payableType: 'hotel_booking',
        payableId: input.payableId,
        amount: input.amount,
        status: 'completed',
        method: 'card',
        paymentReference: randomUUID(),
        paidAt: new Date(),
      })
      .run();
    return Promise.resolve();
  }

  /** True if `roomId` is already assigned to another overlapping, non-cancelled booking. */
  roomHasOverlap(
    roomId: number,
    checkInSec: number,
    checkOutSec: number,
    excludeBookingId?: number,
  ): Promise<boolean> {
    const conditions = [
      eq(hotelBookings.roomId, roomId),
      ne(hotelBookings.status, 'cancelled'),
      lt(hotelBookings.checkIn, new Date(checkOutSec * 1000)),
      gt(hotelBookings.checkOut, new Date(checkInSec * 1000)),
    ];
    if (excludeBookingId) conditions.push(ne(hotelBookings.id, excludeBookingId));
    const row = this.db
      .select({ id: hotelBookings.id })
      .from(hotelBookings)
      .where(and(...conditions))
      .get();
    return Promise.resolve(!!row);
  }
}
