import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Ads keep a denormalized `image` URL for simplicity rather than using the
 * polymorphic images/imageables system — the one intentional exception.
 */
export const advertisements = sqliteTable('advertisements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  image: text('image').notNull(),
  targetUrl: text('target_url').notNull(),
  placement: text('placement', {
    enum: ['homepage', 'sidebar', 'checkout', 'map'],
  }).notNull(),
  startsAt: integer('starts_at', { mode: 'timestamp' }).notNull(),
  endsAt: integer('ends_at', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Advertisement = typeof advertisements.$inferSelect;
export type NewAdvertisement = typeof advertisements.$inferInsert;
