import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  mapLocations,
  type MapLocation,
  type NewMapLocation,
} from '../../shared/database/schema';

/** Sole owner of Drizzle queries for map locations. */
@Injectable()
export class MapLocationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(): Promise<MapLocation[]> {
    return Promise.resolve(
      this.db.select().from(mapLocations).orderBy(asc(mapLocations.name)).all(),
    );
  }

  findById(id: number): Promise<MapLocation | undefined> {
    return Promise.resolve(
      this.db.select().from(mapLocations).where(eq(mapLocations.id, id)).get(),
    );
  }

  create(data: NewMapLocation): Promise<MapLocation> {
    return Promise.resolve(
      this.db.insert(mapLocations).values(data).returning().get(),
    );
  }

  update(
    id: number,
    data: Partial<NewMapLocation>,
  ): Promise<MapLocation | undefined> {
    return Promise.resolve(
      this.db
        .update(mapLocations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(mapLocations.id, id))
        .returning()
        .get(),
    );
  }

  delete(id: number): Promise<void> {
    this.db.delete(mapLocations).where(eq(mapLocations.id, id)).run();
    return Promise.resolve();
  }
}
