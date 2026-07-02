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
  },
  (t) => [primaryKey({ columns: [t.imageId, t.imageableId, t.imageableType] })],
);

export type Imageable = typeof imageables.$inferSelect;
export type NewImageable = typeof imageables.$inferInsert;
