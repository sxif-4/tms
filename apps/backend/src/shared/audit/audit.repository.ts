import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.constants';
import { auditLogs, type NewAuditLog } from '../database/schema';

/** Sole owner of Drizzle writes to the append-only audit_logs table. */
@Injectable()
export class AuditRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  insert(entry: NewAuditLog): Promise<void> {
    this.db.insert(auditLogs).values(entry).run();
    return Promise.resolve();
  }
}
