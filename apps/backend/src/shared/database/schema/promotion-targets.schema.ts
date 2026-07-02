import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { promotions } from './promotions.schema';

/** Scopes a promotion to specific room types / events / ferry routes. */
export const promotionTargets = sqliteTable(
  'promotion_targets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    promotionId: integer('promotion_id')
      .notNull()
      .references(() => promotions.id, { onDelete: 'cascade' }),
    targetType: text('target_type', {
      enum: ['room_type', 'event', 'ferry_route'],
    }).notNull(),
    targetId: integer('target_id').notNull(),
  },
  (t) => [index('promotion_targets_promotion_id_idx').on(t.promotionId)],
);

export type PromotionTarget = typeof promotionTargets.$inferSelect;
export type NewPromotionTarget = typeof promotionTargets.$inferInsert;
