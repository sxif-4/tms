import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { parkTicketTypes } from './park-ticket-types.schema';
import { users } from './users.schema';

export const parkTickets = sqliteTable(
  'park_tickets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ticketReference: text('ticket_reference').notNull().unique(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    ticketTypeId: integer('ticket_type_id')
      .notNull()
      .references(() => parkTicketTypes.id),
    visitDate: integer('visit_date', { mode: 'timestamp' }).notNull(),
    quantity: integer('quantity').notNull(),
    // decimal(10,2) as text — price snapshot at purchase time, never float.
    totalAmount: text('total_amount').notNull(),
    channel: text('channel', { enum: ['online', 'gate'] }).notNull(),
    // Staff who sold it (gate sales); null when bought online.
    soldByUserId: integer('sold_by_user_id').references(() => users.id),
    status: text('status', {
      enum: ['active', 'used', 'cancelled', 'refunded'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('park_tickets_user_id_idx').on(t.userId),
    index('park_tickets_ticket_type_id_idx').on(t.ticketTypeId),
    index('park_tickets_visit_date_idx').on(t.visitDate),
  ],
);

export type ParkTicket = typeof parkTickets.$inferSelect;
export type NewParkTicket = typeof parkTickets.$inferInsert;
