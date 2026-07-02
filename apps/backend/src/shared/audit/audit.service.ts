import { Injectable, Logger } from '@nestjs/common';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditRepository } from './audit.repository';

export interface RecordAuditInput {
  /** The user who performed the action. */
  userId: number;
  action: AuditAction;
  /** Model name of the affected entity, e.g. 'User'. */
  subjectType: string;
  subjectId: number;
  metadata?: Record<string, unknown>;
}

/**
 * Records privileged/system actions to the audit log. Injectable anywhere via
 * the global-ish AuditModule. Recording never throws — a failed audit write is
 * logged but must not break the primary operation.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepo: AuditRepository) {}

  async record(input: RecordAuditInput): Promise<void> {
    try {
      await this.auditRepo.insert({
        userId: input.userId,
        action: input.action,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        metadata: input.metadata,
      });
    } catch (err) {
      this.logger.error(
        `Failed to record audit "${input.action}" on ${input.subjectType}#${input.subjectId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
