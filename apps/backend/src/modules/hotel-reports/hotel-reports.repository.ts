import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';

export interface RevenuePoint {
  day: string;
  revenue: number;
}

export interface OccupancyPoint {
  day: string;
  occupiedRoomNights: number;
  totalRooms: number;
  occupancyRate: number;
}

/**
 * Aggregate-only reporting queries for one hotel's revenue and occupancy over
 * time. Deliberately never selects guest names/emails — these numbers feed
 * charts, not staff-facing booking detail (see hotel-bookings for that).
 */
@Injectable()
export class HotelReportsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  revenueOverTime(
    hotelId: number,
    fromSec: number,
    toSec: number,
  ): Promise<RevenuePoint[]> {
    const rows = this.db.all<RevenuePoint>(sql`
      SELECT date(check_in, 'unixepoch') AS day,
        SUM(CAST(total_amount AS REAL)) AS revenue
      FROM hotel_bookings
      WHERE hotel_id = ${hotelId} AND status != 'cancelled'
        AND check_in BETWEEN ${fromSec} AND ${toSec}
      GROUP BY day ORDER BY day
    `);
    return Promise.resolve(rows);
  }

  async occupancyOverTime(
    hotelId: number,
    fromSec: number,
    toSec: number,
  ): Promise<OccupancyPoint[]> {
    const totalRoomsRow = this.db.get<{ count: number }>(sql`
      SELECT COUNT(*) AS count FROM rooms
      WHERE hotel_id = ${hotelId} AND status != 'out_of_service'
    `);
    const totalRooms = totalRoomsRow?.count ?? 0;

    const rows = this.db.all<{ day: string; occupiedRoomNights: number }>(sql`
      WITH RECURSIVE days(day) AS (
        SELECT date(${fromSec}, 'unixepoch')
        UNION ALL
        SELECT date(day, '+1 day') FROM days WHERE day < date(${toSec}, 'unixepoch')
      )
      SELECT d.day,
        (SELECT COUNT(*) FROM hotel_bookings hb
           WHERE hb.hotel_id = ${hotelId} AND hb.status != 'cancelled'
             AND hb.check_in <= strftime('%s', d.day)
             AND hb.check_out > strftime('%s', d.day)
        ) AS occupiedRoomNights
      FROM days d
    `);

    return rows.map((r) => ({
      day: r.day,
      occupiedRoomNights: r.occupiedRoomNights,
      totalRooms,
      occupancyRate:
        totalRooms > 0
          ? Math.round((r.occupiedRoomNights / totalRooms) * 1000) / 10
          : 0,
    }));
  }
}
