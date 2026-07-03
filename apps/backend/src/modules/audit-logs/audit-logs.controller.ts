import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import { AuditLogsService, type AuditLogPage } from './audit-logs.service';

/** Admin-only audit-log viewer. */
@Controller('audit-logs')
@Roles(Role.Admin)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ): Promise<AuditLogPage> {
    return this.auditLogsService.list(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      action || undefined,
      userId ? parseInt(userId, 10) : undefined,
    );
  }

  @Get('actions')
  actions(): Promise<string[]> {
    return this.auditLogsService.actions();
  }
}
