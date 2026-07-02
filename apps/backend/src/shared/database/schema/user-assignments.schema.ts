import { sql } from 'drizzle-orm';
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { users } from './users.schema';

/**
 * Scopes a staff user to the specific entities they manage. Works with
 * users.role_id: the role grants the capability, this row restricts it to
 * specific instances. Carries only created_at.
 */
export const userAssignments = sqliteTable(
  'user_assignments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assignableType: text('assignable_type', {
      enum: ['hotel', 'ferry_route', 'event'],
    }).notNull(),
    assignableId: integer('assignable_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex('user_assignments_unique').on(
      t.userId,
      t.assignableType,
      t.assignableId,
    ),
  ],
);

export type UserAssignment = typeof userAssignments.$inferSelect;
export type NewUserAssignment = typeof userAssignments.$inferInsert;
