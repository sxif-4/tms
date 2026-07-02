import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users.schema';

/**
 * Polymorphic payment record (payable_type/payable_id). The single source for
 * "sales" totals across every domain.
 */
export const payments = sqliteTable(
  'payments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    payableType: text('payable_type', {
      enum: ['hotel_booking', 'ferry_booking', 'event_booking', 'park_ticket'],
    }).notNull(),
    payableId: integer('payable_id').notNull(),
    // decimal(10,2) as text — exact money, never float.
    amount: text('amount').notNull(),
    status: text('status', {
      enum: ['pending', 'completed', 'failed', 'refunded'],
    }).notNull(),
    method: text('method', {
      enum: ['card', 'cash', 'bank_transfer'],
    }).notNull(),
    paymentReference: text('payment_reference').notNull(),
    paidAt: integer('paid_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('payments_user_id_idx').on(t.userId),
    index('payments_payable_idx').on(t.payableType, t.payableId),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
