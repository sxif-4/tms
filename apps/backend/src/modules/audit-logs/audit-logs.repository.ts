import { Inject, Injectable } from '@nestjs/common';
import { type SQL, and, desc, eq, sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import { auditLogs, users } from '../../shared/database/schema';

export interface AuditLogListItem {
  id: number;
  action: string;
  subjectType: string;
  subjectId: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  userId: number;
  userName: string;
  userEmail: string;
}

interface FindOptions {
  limit: number;
  offset: number;
  action?: string;
  userId?: number;
}

/** Read-only access to the audit trail, joined with the acting user. */
@Injectable()
export class AuditLogsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findPaginated(
    opts: FindOptions,
  ): Promise<{ items: AuditLogListItem[]; total: number }> {
    const conds: SQL[] = [];
    if (opts.action) conds.push(eq(auditLogs.action, opts.action));
    if (opts.userId) conds.push(eq(auditLogs.userId, opts.userId));
    const where = conds.length ? and(...conds) : undefined;

    const items = this.db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        subjectType: auditLogs.subjectType,
        subjectId: auditLogs.subjectId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.id))
      .limit(opts.limit)
      .offset(opts.offset)
      .all();

    const totalRow = this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(where)
      .get();

    return Promise.resolve({ items, total: totalRow?.count ?? 0 });
  }

  distinctActions(): Promise<string[]> {
    const rows = this.db
      .selectDistinct({ action: auditLogs.action })
      .from(auditLogs)
      .orderBy(auditLogs.action)
      .all();
    return Promise.resolve(rows.map((r) => r.action));
  }
}
