import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users.schema';

/** Append-only log of privileged/system actions. Carries only created_at. */
export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    action: text('action').notNull(),
    subjectType: text('subject_type').notNull(),
    subjectId: integer('subject_id').notNull(),
    metadata: text('metadata', { mode: 'json' }).$type<
      Record<string, unknown>
    >(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('audit_logs_user_id_idx').on(t.userId)],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
