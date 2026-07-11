import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import { hotels, type Hotel } from '../../shared/database/schema';

/** Sole owner of Drizzle queries for hotels. */
@Injectable()
export class HotelsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(): Promise<Hotel[]> {
    return Promise.resolve(
      this.db.select().from(hotels).orderBy(asc(hotels.name)).all(),
    );
  }

  findByIds(ids: number[]): Promise<Hotel[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return Promise.resolve(
      this.db
        .select()
        .from(hotels)
        .where(inArray(hotels.id, ids))
        .orderBy(asc(hotels.name))
        .all(),
    );
  }

  findById(id: number): Promise<Hotel | undefined> {
    return Promise.resolve(
      this.db.select().from(hotels).where(eq(hotels.id, id)).get(),
    );
  }
}
