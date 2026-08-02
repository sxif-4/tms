import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  facilities,
  hotelFacilities,
  type Facility,
} from '../../shared/database/schema';

/** Sole owner of Drizzle queries for facilities and the hotel junction. */
@Injectable()
export class FacilitiesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(): Promise<Facility[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(facilities)
        .orderBy(asc(facilities.category), asc(facilities.name))
        .all(),
    );
  }

  findExistingIds(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return Promise.resolve([]);
    const rows = this.db
      .select({ id: facilities.id })
      .from(facilities)
      .where(inArray(facilities.id, ids))
      .all();
    return Promise.resolve(rows.map((r) => r.id));
  }

  findForHotel(hotelId: number): Promise<Facility[]> {
    const rows = this.db
      .select({ facility: facilities })
      .from(hotelFacilities)
      .innerJoin(facilities, eq(facilities.id, hotelFacilities.facilityId))
      .where(eq(hotelFacilities.hotelId, hotelId))
      .orderBy(asc(facilities.category), asc(facilities.name))
      .all();
    return Promise.resolve(rows.map((r) => r.facility));
  }

  /** Batch variant so a hotel list costs one query, not one per row. */
  findForHotels(hotelIds: number[]): Promise<Map<number, Facility[]>> {
    const grouped = new Map<number, Facility[]>();
    if (hotelIds.length === 0) return Promise.resolve(grouped);

    const rows = this.db
      .select({ hotelId: hotelFacilities.hotelId, facility: facilities })
      .from(hotelFacilities)
      .innerJoin(facilities, eq(facilities.id, hotelFacilities.facilityId))
      .where(inArray(hotelFacilities.hotelId, hotelIds))
      .orderBy(asc(facilities.category), asc(facilities.name))
      .all();

    for (const row of rows) {
      const existing = grouped.get(row.hotelId);
      if (existing) existing.push(row.facility);
      else grouped.set(row.hotelId, [row.facility]);
    }
    return Promise.resolve(grouped);
  }

  /** Replaces a hotel's whole facility set — the picker submits all of it. */
  replaceForHotel(hotelId: number, facilityIds: number[]): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(hotelFacilities)
        .where(eq(hotelFacilities.hotelId, hotelId))
        .run();
      if (facilityIds.length > 0) {
        tx.insert(hotelFacilities)
          .values(facilityIds.map((facilityId) => ({ hotelId, facilityId })))
          .run();
      }
    });
    return Promise.resolve();
  }
}
