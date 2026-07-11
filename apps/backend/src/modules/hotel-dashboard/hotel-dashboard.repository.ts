import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';

export interface RoomStatsRow {
  totalRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
}

export interface UnassignedBookingRow {
  id: number;
  bookingReference: string;
  checkIn: number;
  roomTypeName: string;
  guests: number;
}

export interface PendingBookingRow {
  id: number;
  bookingReference: string;
  checkIn: number;
  roomTypeName: string;
  totalAmount: string;
}

export interface MaintenanceRoomRow {
  id: number;
  roomNumber: string;
  status: string;
  roomTypeName: string;
}

export interface DaySheetRow {
  id: number;
  bookingReference: string;
  guestName: string;
  roomTypeName: string;
  roomNumber: string | null;
  guests: number;
  status: string;
}

export interface RevenuePoint {
  day: string;
  revenue: number;
}

/** Read-only aggregation queries backing the hotel-staff dashboard, scoped to one hotel at a time. */
@Injectable()
export class HotelDashboardRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  roomStats(hotelId: number): Promise<RoomStatsRow> {
    const row = this.db.get<RoomStatsRow>(sql`
      SELECT
        COUNT(*) AS totalRooms,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS occupiedRooms,
        SUM(CASE WHEN status IN ('maintenance', 'out_of_service') THEN 1 ELSE 0 END) AS maintenanceRooms
      FROM rooms WHERE hotel_id = ${hotelId}
    `);
    return Promise.resolve(
      row ?? { totalRooms: 0, occupiedRooms: 0, maintenanceRooms: 0 },
    );
  }

  activeBookingsCount(hotelId: number): Promise<number> {
    const row = this.db.get<{ count: number }>(sql`
      SELECT COUNT(*) AS count FROM hotel_bookings
      WHERE hotel_id = ${hotelId} AND status IN ('pending', 'confirmed')
    `);
    return Promise.resolve(row?.count ?? 0);
  }

  revenueLast30Days(hotelId: number): Promise<number> {
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = nowSec - 30 * 86_400;
    const row = this.db.get<{ revenue: number }>(sql`
      SELECT COALESCE(SUM(CAST(total_amount AS REAL)), 0) AS revenue
      FROM hotel_bookings
      WHERE hotel_id = ${hotelId} AND status != 'cancelled'
        AND check_in BETWEEN ${fromSec} AND ${nowSec}
    `);
    return Promise.resolve(row?.revenue ?? 0);
  }

  revenueTrend(hotelId: number, days = 30): Promise<RevenuePoint[]> {
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = nowSec - days * 86_400;
    const rows = this.db.all<RevenuePoint>(sql`
      SELECT date(check_in, 'unixepoch') AS day,
        SUM(CAST(total_amount AS REAL)) AS revenue
      FROM hotel_bookings
      WHERE hotel_id = ${hotelId} AND status != 'cancelled'
        AND check_in BETWEEN ${fromSec} AND ${nowSec}
      GROUP BY day ORDER BY day
    `);
    return Promise.resolve(rows);
  }

  unassignedUpcoming(
    hotelId: number,
    limit = 5,
  ): Promise<{ total: number; items: UnassignedBookingRow[] }> {
    const nowSec = Math.floor(Date.now() / 1000);
    const totalRow = this.db.get<{ count: number }>(sql`
      SELECT COUNT(*) AS count FROM hotel_bookings
      WHERE hotel_id = ${hotelId} AND room_id IS NULL AND status != 'cancelled'
        AND check_out > ${nowSec}
    `);
    const items = this.db.all<UnassignedBookingRow>(sql`
      SELECT hb.id, hb.booking_reference AS bookingReference, hb.check_in AS checkIn,
        rt.name AS roomTypeName, hb.guests
      FROM hotel_bookings hb JOIN room_types rt ON rt.id = hb.room_type_id
      WHERE hb.hotel_id = ${hotelId} AND hb.room_id IS NULL AND hb.status != 'cancelled'
        AND hb.check_out > ${nowSec}
      ORDER BY hb.check_in ASC LIMIT ${limit}
    `);
    return Promise.resolve({ total: totalRow?.count ?? 0, items });
  }

  pendingConfirmations(
    hotelId: number,
    limit = 5,
  ): Promise<{ total: number; items: PendingBookingRow[] }> {
    const totalRow = this.db.get<{ count: number }>(sql`
      SELECT COUNT(*) AS count FROM hotel_bookings
      WHERE hotel_id = ${hotelId} AND status = 'pending'
    `);
    const items = this.db.all<PendingBookingRow>(sql`
      SELECT hb.id, hb.booking_reference AS bookingReference, hb.check_in AS checkIn,
        rt.name AS roomTypeName, hb.total_amount AS totalAmount
      FROM hotel_bookings hb JOIN room_types rt ON rt.id = hb.room_type_id
      WHERE hb.hotel_id = ${hotelId} AND hb.status = 'pending'
      ORDER BY hb.check_in ASC LIMIT ${limit}
    `);
    return Promise.resolve({ total: totalRow?.count ?? 0, items });
  }

  roomsInMaintenance(
    hotelId: number,
    limit = 5,
  ): Promise<{ total: number; items: MaintenanceRoomRow[] }> {
    const totalRow = this.db.get<{ count: number }>(sql`
      SELECT COUNT(*) AS count FROM rooms
      WHERE hotel_id = ${hotelId} AND status IN ('maintenance', 'out_of_service')
    `);
    const items = this.db.all<MaintenanceRoomRow>(sql`
      SELECT r.id, r.room_number AS roomNumber, r.status, rt.name AS roomTypeName
      FROM rooms r JOIN room_types rt ON rt.id = r.room_type_id
      WHERE r.hotel_id = ${hotelId} AND r.status IN ('maintenance', 'out_of_service')
      LIMIT ${limit}
    `);
    return Promise.resolve({ total: totalRow?.count ?? 0, items });
  }

  daySheet(hotelId: number, column: 'check_in' | 'check_out'): Promise<DaySheetRow[]> {
    return Promise.resolve(
      this.db.all<DaySheetRow>(sql`
        SELECT hb.id, hb.booking_reference AS bookingReference, u.name AS guestName,
          rt.name AS roomTypeName, r.room_number AS roomNumber, hb.guests, hb.status
        FROM hotel_bookings hb
          JOIN users u ON u.id = hb.user_id
          JOIN room_types rt ON rt.id = hb.room_type_id
          LEFT JOIN rooms r ON r.id = hb.room_id
        WHERE hb.hotel_id = ${hotelId} AND hb.status != 'cancelled'
          AND date(hb.${sql.raw(column)}, 'unixepoch') = date('now')
        ORDER BY hb.${sql.raw(column)} ASC
      `),
    );
  }
}
