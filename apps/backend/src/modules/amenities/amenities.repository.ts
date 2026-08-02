import { Inject, Injectable } from '@nestjs/common';
import { asc, inArray } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import { amenities, type Amenity } from '../../shared/database/schema';

/** Sole owner of Drizzle queries for the amenity catalog. */
@Injectable()
export class AmenitiesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(): Promise<Amenity[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(amenities)
        .orderBy(asc(amenities.category), asc(amenities.name))
        .all(),
    );
  }

  /** The subset of `ids` that actually exist — used to reject unknown ids. */
  findExistingIds(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return Promise.resolve([]);
    const rows = this.db
      .select({ id: amenities.id })
      .from(amenities)
      .where(inArray(amenities.id, ids))
      .all();
    return Promise.resolve(rows.map((r) => r.id));
  }
}
