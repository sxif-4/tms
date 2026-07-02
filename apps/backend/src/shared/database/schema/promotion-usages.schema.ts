import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { promotions } from './promotions.schema';
import { users } from './users.schema';

/** Append-only record of each promotion redemption. Carries only created_at. */
export const promotionUsages = sqliteTable(
  'promotion_usages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    promotionId: integer('promotion_id')
      .notNull()
      .references(() => promotions.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    appliedToType: text('applied_to_type', {
      enum: ['hotel_booking', 'ferry_booking', 'event_booking', 'park_ticket'],
    }).notNull(),
    appliedToId: integer('applied_to_id').notNull(),
    // decimal(10,2) as text — actual discount given, never float.
    discountAmount: text('discount_amount').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('promotion_usages_promotion_id_idx').on(t.promotionId),
    index('promotion_usages_user_id_idx').on(t.userId),
  ],
);

export type PromotionUsage = typeof promotionUsages.$inferSelect;
export type NewPromotionUsage = typeof promotionUsages.$inferInsert;
