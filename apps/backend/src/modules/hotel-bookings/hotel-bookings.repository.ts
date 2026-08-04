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
  /** How it was booked — `staff` for a front-desk booking. */
  channel: 'online' | 'staff';
  soldByUserId: number | null;
  source: 'walk_in' | 'phone' | 'email' | 'corporate' | 'ota' | null;
  arrivalTime: string | null;
  specialRequests: string | null;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** One room type's inventory position for a specific date range. */
export interface RoomTypeAvailabilityRow {
  roomTypeId: number;
  name: string;
  basePricePerNight: string;
  maxOccupancy: number;
  /** Cover photo — staff recognise a room type by sight faster than by name. */
  image: string | null;
  /** Physical rooms of this type that could be sold (excludes out-of-service). */
  totalRooms: number;
  /** Overlapping non-cancelled bookings — the ones already spoken for. */
  bookedRooms: number;
  /** Rooms free for the whole range and safe to pre-assign. */
  freeRooms: { id: number; roomNumber: string }[];
}

/** A guest the desk can attach a booking to, with their history here. */
export interface GuestSearchRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  /** Non-cancelled bookings this guest has had at this hotel. */
  stays: number;
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
  channel: hotelBookings.channel,
  soldByUserId: hotelBookings.soldByUserId,
  source: hotelBookings.source,
  arrivalTime: hotelBookings.arrivalTime,
  specialRequests: hotelBookings.specialRequests,
  internalNotes: hotelBookings.internalNotes,
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
    if (hotelIds !== 'all')
      conditions.push(inArray(hotelBookings.hotelId, hotelIds));
    if (filters.hotelId)
      conditions.push(eq(hotelBookings.hotelId, filters.hotelId));
    if (filters.status)
      conditions.push(
        eq(hotelBookings.status, filters.status as HotelBooking['status']),
      );

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
    return Promise.resolve(row);
  }

  findRawById(id: number): Promise<HotelBooking | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(hotelBookings)
        .where(eq(hotelBookings.id, id))
        .get(),
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
    if (excludeBookingId)
      conditions.push(ne(hotelBookings.id, excludeBookingId));
    const rows = this.db
      .select({ id: hotelBookings.id })
      .from(hotelBookings)
      .where(and(...conditions))
      .all();
    return Promise.resolve(rows.length);
  }

  /**
   * Per-room-type availability for one hotel over a date range — the numbers
   * the front desk needs before it can quote anything. Uses exactly the same
   * definition as the create path (`countRoomsOfType` / `countOverlapping`) so
   * a room the desk is shown as free can't be rejected on submit.
   */
  availabilityByRoomType(
    hotelId: number,
    checkInSec: number,
    checkOutSec: number,
  ): Promise<RoomTypeAvailabilityRow[]> {
    const types = this.db.all<{
      roomTypeId: number;
      name: string;
      basePricePerNight: string;
      maxOccupancy: number;
      image: string | null;
      totalRooms: number;
    }>(sql`
      SELECT rt.id AS roomTypeId, rt.name, rt.base_price_per_night AS basePricePerNight,
        rt.max_occupancy AS maxOccupancy,
        (SELECT COUNT(*) FROM rooms r
          WHERE r.room_type_id = rt.id AND r.hotel_id = ${hotelId}
            AND r.status != 'out_of_service') AS totalRooms,
        (SELECT i.url FROM imageables im
          JOIN images i ON i.id = im.image_id
          WHERE im.imageable_type = 'room_type' AND im.imageable_id = rt.id
          ORDER BY im.is_cover DESC, im.sort_order, i.id
          LIMIT 1) AS image
      FROM room_types rt
      WHERE rt.hotel_id = ${hotelId}
      ORDER BY rt.base_price_per_night
    `);

    // A booking holds a room of its type whether or not a specific room has
    // been assigned yet, so this counts bookings — not assigned room ids.
    const booked = this.db.all<{ roomTypeId: number; bookedRooms: number }>(sql`
      SELECT room_type_id AS roomTypeId, COUNT(*) AS bookedRooms
      FROM hotel_bookings
      WHERE hotel_id = ${hotelId} AND status != 'cancelled'
        AND check_in < ${checkOutSec} AND check_out > ${checkInSec}
      GROUP BY room_type_id
    `);
    const bookedByType = new Map(
      booked.map((b) => [b.roomTypeId, b.bookedRooms]),
    );

    // Rooms with no overlapping assignment. A room can be free here while its
    // type has none left overall — unassigned bookings still hold inventory.
    const free = this.db.all<{
      roomTypeId: number;
      id: number;
      roomNumber: string;
    }>(sql`
      SELECT r.room_type_id AS roomTypeId, r.id, r.room_number AS roomNumber
      FROM rooms r
      WHERE r.hotel_id = ${hotelId} AND r.status != 'out_of_service'
        AND NOT EXISTS (
          SELECT 1 FROM hotel_bookings hb
          WHERE hb.room_id = r.id AND hb.status != 'cancelled'
            AND hb.check_in < ${checkOutSec} AND hb.check_out > ${checkInSec}
        )
      ORDER BY r.room_number
    `);
    const freeByType = new Map<number, { id: number; roomNumber: string }[]>();
    for (const room of free) {
      const list = freeByType.get(room.roomTypeId) ?? [];
      list.push({ id: room.id, roomNumber: room.roomNumber });
      freeByType.set(room.roomTypeId, list);
    }

    return Promise.resolve(
      types.map((t) => ({
        roomTypeId: t.roomTypeId,
        name: t.name,
        basePricePerNight: t.basePricePerNight,
        maxOccupancy: t.maxOccupancy,
        image: t.image,
        totalRooms: t.totalRooms,
        bookedRooms: bookedByType.get(t.roomTypeId) ?? 0,
        freeRooms: freeByType.get(t.roomTypeId) ?? [],
      })),
    );
  }

  /**
   * Visitor accounts matched on name, email or phone, with their stay count at
   * this hotel. Capped — this backs a type-ahead, not a report.
   */
  searchGuests(hotelId: number, query?: string): Promise<GuestSearchRow[]> {
    const trimmed = query?.trim();
    const like = `%${trimmed ?? ''}%`;
    const rows = this.db.all<GuestSearchRow>(sql`
      SELECT u.id, u.name, u.email, u.phone,
        (SELECT COUNT(*) FROM hotel_bookings hb
          WHERE hb.user_id = u.id AND hb.hotel_id = ${hotelId}
            AND hb.status != 'cancelled') AS stays
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.slug = 'visitor' AND u.is_active = 1
        ${
          trimmed
            ? sql`AND (u.name LIKE ${like} OR u.email LIKE ${like} OR u.phone LIKE ${like})`
            : sql``
        }
      -- Guests who've stayed here before surface first: the desk is usually
      -- looking for one of them.
      ORDER BY stays DESC, u.name
      LIMIT 20
    `);
    return Promise.resolve(rows);
  }

  /** Inserts a completed mock payment for a freshly created booking. No real processor is wired up. */
  recordMockPayment(input: {
    userId: number;
    payableId: number;
    amount: string;
    /** Card online; whatever the desk actually took otherwise. */
    method?: 'card' | 'cash' | 'bank_transfer';
  }): Promise<void> {
    this.db
      .insert(payments)
      .values({
        userId: input.userId,
        payableType: 'hotel_booking',
        payableId: input.payableId,
        amount: input.amount,
        status: 'completed',
        method: input.method ?? 'card',
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
    if (excludeBookingId)
      conditions.push(ne(hotelBookings.id, excludeBookingId));
    const row = this.db
      .select({ id: hotelBookings.id })
      .from(hotelBookings)
      .where(and(...conditions))
      .get();
    return Promise.resolve(!!row);
  }
}
