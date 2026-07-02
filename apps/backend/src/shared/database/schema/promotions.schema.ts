import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const promotions = sqliteTable('promotions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  // null = auto-applied (no coupon code to enter).
  code: text('code').unique(),
  discountType: text('discount_type', {
    enum: ['percentage', 'fixed'],
  }).notNull(),
  // decimal(10,2) as text — exact money/percentage value, never float.
  discountValue: text('discount_value').notNull(),
  minSpend: text('min_spend'),
  usageLimit: integer('usage_limit'),
  perUserLimit: integer('per_user_limit'),
  validFrom: integer('valid_from', { mode: 'timestamp' }).notNull(),
  validTo: integer('valid_to', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
