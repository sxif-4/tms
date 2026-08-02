import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { images } from './images.schema';

/** Polymorphic join between images and any owning entity (room, event, ...). */
export const imageables = sqliteTable(
  'imageables',
  {
    imageId: integer('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    imageableId: integer('imageable_id').notNull(),
    imageableType: text('imageable_type').notNull(),
    /**
     * At most one image per owner carries this — the gallery thumbnail. The
     * service clears the previous cover when a new one is set; SQLite can't
     * express a partial unique constraint over a polymorphic owner.
     */
    isCover: integer('is_cover', { mode: 'boolean' }).notNull().default(false),
    /** Gallery position, ties broken by image id. */
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.imageId, t.imageableId, t.imageableType] })],
);

export type Imageable = typeof imageables.$inferSelect;
export type NewImageable = typeof imageables.$inferInsert;
