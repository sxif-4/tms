import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, lte, gte } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  advertisements,
  type Advertisement,
  type NewAdvertisement,
} from '../../shared/database/schema';

/** Sole owner of Drizzle queries for advertisements. */
@Injectable()
export class AdvertisementsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(): Promise<Advertisement[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(advertisements)
        .orderBy(desc(advertisements.createdAt))
        .all(),
    );
  }

  /** Currently-running, active ads — optionally narrowed to one placement. */
  findActive(placement?: string): Promise<Advertisement[]> {
    const now = new Date();
    const conditions = [
      eq(advertisements.isActive, true),
      lte(advertisements.startsAt, now),
      gte(advertisements.endsAt, now),
    ];
    if (placement) {
      conditions.push(
        eq(advertisements.placement, placement as Advertisement['placement']),
      );
    }
    return Promise.resolve(
      this.db
        .select()
        .from(advertisements)
        .where(and(...conditions))
        .orderBy(desc(advertisements.createdAt))
        .all(),
    );
  }

  findById(id: number): Promise<Advertisement | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(advertisements)
        .where(eq(advertisements.id, id))
        .get(),
    );
  }

  create(data: NewAdvertisement): Promise<Advertisement> {
    return Promise.resolve(
      this.db.insert(advertisements).values(data).returning().get(),
    );
  }

  update(
    id: number,
    data: Partial<NewAdvertisement>,
  ): Promise<Advertisement | undefined> {
    return Promise.resolve(
      this.db
        .update(advertisements)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(advertisements.id, id))
        .returning()
        .get(),
    );
  }

  delete(id: number): Promise<void> {
    this.db.delete(advertisements).where(eq(advertisements.id, id)).run();
    return Promise.resolve();
  }
}
