import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  promotionTargets,
  promotionUsages,
  promotions,
  type NewPromotion,
  type NewPromotionTarget,
  type Promotion,
  type PromotionTarget,
  type PromotionUsage,
} from '../../shared/database/schema';

export interface PromotionWithTargets extends Promotion {
  targets: PromotionTarget[];
}

/** Sole owner of Drizzle queries for promotions, their targets and usages. */
@Injectable()
export class PromotionsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAllWithTargets(): Promise<PromotionWithTargets[]> {
    const promos = this.db
      .select()
      .from(promotions)
      .orderBy(desc(promotions.createdAt))
      .all();
    const targets = this.db.select().from(promotionTargets).all();

    const byPromo = new Map<number, PromotionTarget[]>();
    for (const t of targets) {
      const list = byPromo.get(t.promotionId) ?? [];
      list.push(t);
      byPromo.set(t.promotionId, list);
    }
    return Promise.resolve(
      promos.map((p) => ({ ...p, targets: byPromo.get(p.id) ?? [] })),
    );
  }

  findByIdWithTargets(id: number): Promise<PromotionWithTargets | undefined> {
    const promo = this.db
      .select()
      .from(promotions)
      .where(eq(promotions.id, id))
      .get();
    if (!promo) return Promise.resolve(undefined);
    const targets = this.db
      .select()
      .from(promotionTargets)
      .where(eq(promotionTargets.promotionId, id))
      .all();
    return Promise.resolve({ ...promo, targets });
  }

  findByCode(code: string): Promise<Promotion | undefined> {
    return Promise.resolve(
      this.db.select().from(promotions).where(eq(promotions.code, code)).get(),
    );
  }

  create(data: NewPromotion): Promise<Promotion> {
    return Promise.resolve(
      this.db.insert(promotions).values(data).returning().get(),
    );
  }

  update(
    id: number,
    data: Partial<NewPromotion>,
  ): Promise<Promotion | undefined> {
    return Promise.resolve(
      this.db
        .update(promotions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(promotions.id, id))
        .returning()
        .get(),
    );
  }

  /** Wholesale replace of a promotion's targets. */
  replaceTargets(
    promotionId: number,
    targets: Omit<NewPromotionTarget, 'promotionId'>[],
  ): Promise<void> {
    this.db
      .delete(promotionTargets)
      .where(eq(promotionTargets.promotionId, promotionId))
      .run();
    if (targets.length) {
      this.db
        .insert(promotionTargets)
        .values(targets.map((t) => ({ ...t, promotionId })))
        .run();
    }
    return Promise.resolve();
  }

  delete(id: number): Promise<void> {
    this.db.delete(promotions).where(eq(promotions.id, id)).run();
    return Promise.resolve();
  }

  countUsages(promotionId: number): Promise<number> {
    const rows = this.db
      .select({ id: promotionUsages.id })
      .from(promotionUsages)
      .where(eq(promotionUsages.promotionId, promotionId))
      .all();
    return Promise.resolve(rows.length);
  }

  listUsages(promotionId: number): Promise<PromotionUsage[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(promotionUsages)
        .where(eq(promotionUsages.promotionId, promotionId))
        .orderBy(desc(promotionUsages.createdAt))
        .all(),
    );
  }
}
