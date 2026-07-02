import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const ferryRoutes = sqliteTable('ferry_routes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type FerryRoute = typeof ferryRoutes.$inferSelect;
export type NewFerryRoute = typeof ferryRoutes.$inferInsert;
