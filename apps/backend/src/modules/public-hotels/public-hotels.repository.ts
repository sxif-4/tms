import { Inject, Injectable } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';

export interface PublicHotelSummary {
  id: number;
  name: string;
  description: string | null;
  positionTop: string | null;
  positionLeft: string | null;
  minPrice: number | null;
  image: string | null;
  imageCount: number;
}

export interface PublicAmenity {
  id: number;
  name: string;
  icon: string | null;
  category: string;
}

export interface PublicRoomType {
  id: number;
  name: string;
  description: string;
  basePricePerNight: string;
  maxOccupancy: number;
  totalRooms: number;
  image: string | null;
  images: string[];
  amenities: PublicAmenity[];
}

export interface PublicHotelDetail extends PublicHotelSummary {
  maxRooms: number;
  images: string[];
  roomTypes: PublicRoomType[];
}

export interface RoomTypeAvailabilityRow {
  roomTypeId: number;
  name: string;
  description: string;
  basePricePerNight: string;
  maxOccupancy: number;
  totalRooms: number;
  overlapping: number;
  image: string | null;
  images: string[];
  amenities: PublicAmenity[];
}

export interface DayAvailabilityRow {
  day: string;
  totalRooms: number;
  booked: number;
}

/** Read-only, unauthenticated queries for the visitor-facing hotel browsing flow. */
@Injectable()
export class PublicHotelsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  listSummaries(
    filters: {
      minPrice?: number;
      maxPrice?: number;
      guests?: number;
    } = {},
  ): Promise<PublicHotelSummary[]> {
    const guestsFilter: SQL = filters.guests
      ? sql`AND EXISTS (
          SELECT 1 FROM rooms r2 JOIN room_types rt2 ON rt2.id = r2.room_type_id
          WHERE r2.hotel_id = h.id AND rt2.max_occupancy >= ${filters.guests}
        )`
      : sql``;

    const rows = this.db.all<PublicHotelSummary>(sql`
      SELECT * FROM (
        SELECT h.id, h.name, h.description,
          ml.position_top AS positionTop, ml.position_left AS positionLeft,
          (SELECT MIN(CAST(rt.base_price_per_night AS REAL))
             FROM rooms r JOIN room_types rt ON rt.id = r.room_type_id
             WHERE r.hotel_id = h.id AND r.status != 'out_of_service') AS minPrice,
          (SELECT i.url FROM imageables im JOIN images i ON i.id = im.image_id
             WHERE im.imageable_type = 'hotel' AND im.imageable_id = h.id LIMIT 1) AS image,
          (SELECT COUNT(*) FROM imageables im
             WHERE im.imageable_type = 'hotel' AND im.imageable_id = h.id) AS imageCount
        FROM hotels h LEFT JOIN map_locations ml ON ml.id = h.map_location_id
        WHERE 1 = 1 ${guestsFilter}
      )
      WHERE 1 = 1
        ${filters.minPrice != null ? sql`AND (minPrice IS NULL OR minPrice >= ${filters.minPrice})` : sql``}
        ${filters.maxPrice != null ? sql`AND (minPrice IS NULL OR minPrice <= ${filters.maxPrice})` : sql``}
      ORDER BY name
    `);
    return Promise.resolve(rows);
  }

  async detail(hotelId: number): Promise<PublicHotelDetail | undefined> {
    const hotel = this.db.get<PublicHotelSummary & { maxRooms: number }>(sql`
      SELECT h.id, h.name, h.description, h.max_rooms AS maxRooms,
        ml.position_top AS positionTop, ml.position_left AS positionLeft,
        (SELECT MIN(CAST(rt.base_price_per_night AS REAL))
           FROM rooms r JOIN room_types rt ON rt.id = r.room_type_id
           WHERE r.hotel_id = h.id AND r.status != 'out_of_service') AS minPrice,
        NULL AS image
      FROM hotels h LEFT JOIN map_locations ml ON ml.id = h.map_location_id
      WHERE h.id = ${hotelId}
    `);
    if (!hotel) return undefined;

    const images = this.db
      .all<{ url: string }>(
        sql`
        SELECT i.url FROM imageables im JOIN images i ON i.id = im.image_id
        WHERE im.imageable_type = 'hotel' AND im.imageable_id = ${hotelId}
      `,
      )
      .map((r) => r.url);

    const roomTypeRows = this.db.all<
      Omit<PublicRoomType, 'amenities' | 'image' | 'images'>
    >(sql`
      SELECT rt.id, rt.name, rt.description,
        rt.base_price_per_night AS basePricePerNight, rt.max_occupancy AS maxOccupancy,
        COUNT(r.id) AS totalRooms
      FROM room_types rt JOIN rooms r ON r.room_type_id = rt.id
      WHERE r.hotel_id = ${hotelId} AND r.status != 'out_of_service'
      GROUP BY rt.id
      ORDER BY CAST(rt.base_price_per_night AS REAL)
    `);

    const amenitiesByType = this.amenitiesByRoomType(hotelId);
    const imagesByType = this.imagesByRoomType(roomTypeRows.map((rt) => rt.id));

    const roomTypes: PublicRoomType[] = roomTypeRows.map((rt) => {
      const imgs = imagesByType.get(rt.id) ?? [];
      return {
        ...rt,
        image: imgs[0] ?? null,
        images: imgs,
        amenities: amenitiesByType.get(rt.id) ?? [],
      };
    });

    return {
      ...hotel,
      image: images[0] ?? null,
      imageCount: images.length,
      images,
      roomTypes,
    };
  }

  availability(
    hotelId: number,
    checkInSec: number,
    checkOutSec: number,
  ): Promise<RoomTypeAvailabilityRow[]> {
    const rows = this.db.all<
      Omit<RoomTypeAvailabilityRow, 'amenities' | 'image' | 'images'>
    >(sql`
      SELECT rt.id AS roomTypeId, rt.name, rt.description,
        rt.base_price_per_night AS basePricePerNight, rt.max_occupancy AS maxOccupancy,
        (SELECT COUNT(*) FROM rooms r
           WHERE r.hotel_id = ${hotelId} AND r.room_type_id = rt.id
             AND r.status != 'out_of_service') AS totalRooms,
        (SELECT COUNT(*) FROM hotel_bookings hb
           WHERE hb.hotel_id = ${hotelId} AND hb.room_type_id = rt.id
             AND hb.status != 'cancelled'
             AND hb.check_in < ${checkOutSec} AND hb.check_out > ${checkInSec}
        ) AS overlapping
      FROM room_types rt
      WHERE EXISTS (
        SELECT 1 FROM rooms r WHERE r.hotel_id = ${hotelId} AND r.room_type_id = rt.id
      )
      ORDER BY CAST(rt.base_price_per_night AS REAL)
    `);
    const amenitiesByType = this.amenitiesByRoomType(hotelId);
    const imagesByType = this.imagesByRoomType(rows.map((r) => r.roomTypeId));
    return Promise.resolve(
      rows.map((r) => {
        const imgs = imagesByType.get(r.roomTypeId) ?? [];
        return {
          ...r,
          image: imgs[0] ?? null,
          images: imgs,
          amenities: amenitiesByType.get(r.roomTypeId) ?? [],
        };
      }),
    );
  }

  availabilityCalendar(
    hotelId: number,
    roomTypeId: number | undefined,
    fromSec: number,
    toSec: number,
  ): Promise<DayAvailabilityRow[]> {
    const roomFilter: SQL = roomTypeId
      ? sql`AND r.room_type_id = ${roomTypeId}`
      : sql``;
    const bookingFilter: SQL = roomTypeId
      ? sql`AND hb.room_type_id = ${roomTypeId}`
      : sql``;

    const rows = this.db.all<DayAvailabilityRow>(sql`
      WITH RECURSIVE days(day) AS (
        SELECT date(${fromSec}, 'unixepoch')
        UNION ALL
        SELECT date(day, '+1 day') FROM days WHERE day < date(${toSec}, 'unixepoch')
      )
      SELECT d.day,
        (SELECT COUNT(*) FROM rooms r
           WHERE r.hotel_id = ${hotelId} AND r.status != 'out_of_service' ${roomFilter}
        ) AS totalRooms,
        (SELECT COUNT(*) FROM hotel_bookings hb
           WHERE hb.hotel_id = ${hotelId} AND hb.status != 'cancelled' ${bookingFilter}
             AND hb.check_in <= strftime('%s', d.day)
             AND hb.check_out > strftime('%s', d.day)
        ) AS booked
      FROM days d
    `);
    return Promise.resolve(rows);
  }
}
