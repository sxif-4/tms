import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const parkTicketTypes = sqliteTable('park_ticket_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  // decimal(10,2) as text — exact money, never float.
  price: text('price').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type ParkTicketType = typeof parkTicketTypes.$inferSelect;
export type NewParkTicketType = typeof parkTicketTypes.$inferInsert;
