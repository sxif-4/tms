import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/** Catalog of resort amenities (Wi‑Fi, private pool, etc.). */
export const amenities = sqliteTable(
  'amenities',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    /** Optional lucide-style icon key, e.g. `wifi`, `waves`. */
    icon: text('icon'),
    category: text('category', {
      enum: ['comfort', 'bathroom', 'view', 'outdoor', 'tech', 'dining'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex('amenities_name_unique').on(t.name)],
);

export type Amenity = typeof amenities.$inferSelect;
export type NewAmenity = typeof amenities.$inferInsert;
