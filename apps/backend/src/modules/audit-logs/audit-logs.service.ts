import { Injectable } from '@nestjs/common';
import {
  AuditLogsRepository,
  type AuditLogListItem,
} from './audit-logs.repository';

export interface AuditLogPage {
  items: AuditLogListItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepo: AuditLogsRepository) {}

  async list(
    page: number,
    pageSize: number,
    action?: string,
    userId?: number,
  ): Promise<AuditLogPage> {
    const limit = Math.min(Math.max(pageSize, 1), 100);
    const current = Math.max(page, 1);
    const { items, total } = await this.auditLogsRepo.findPaginated({
      limit,
      offset: (current - 1) * limit,
      action,
      userId,
    });
    return { items, total, page: current, pageSize: limit };
  }

  actions(): Promise<string[]> {
    return this.auditLogsRepo.distinctActions();
  }
}
