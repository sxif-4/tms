import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  hotels,
  type Hotel,
  type NewHotel,
} from '../../shared/database/schema';

/** Sole owner of Drizzle queries for hotels. */
@Injectable()
export class HotelsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  create(data: NewHotel): Promise<Hotel> {
    return Promise.resolve(
      this.db.insert(hotels).values(data).returning().get(),
    );
  }

  update(id: number, data: Partial<NewHotel>): Promise<Hotel | undefined> {
    return Promise.resolve(
      this.db
        .update(hotels)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(hotels.id, id))
        .returning()
        .get(),
    );
  }

  setActive(id: number, isActive: boolean): Promise<void> {
    this.db
      .update(hotels)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(hotels.id, id))
      .run();
    return Promise.resolve();
  }

  nameExists(name: string): Promise<boolean> {
    const row = this.db
      .select({ id: hotels.id })
      .from(hotels)
      .where(eq(hotels.name, name))
      .get();
    return Promise.resolve(!!row);
  }

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
