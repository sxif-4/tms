import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import {
  ParkReportsService,
  SALES_GROUP_BY,
  type EventReportRow,
  type SalesGroupBy,
  type SalesRow,
  type VisitorRow,
} from './park-reports.service';

/** Aggregate-only park reporting — never buyer names, emails or references. */
@Controller('park-reports')
@Roles(Role.Admin, Role.ParkStaff)
export class ParkReportsController {
  constructor(private readonly reportsService: ParkReportsService) {}

  @Get('sales')
  sales(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: string,
  ): Promise<SalesRow[]> {
    return this.reportsService.sales(from, to, parseGroupBy(groupBy));
  }

  @Get('visitors')
  visitors(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<VisitorRow[]> {
    return this.reportsService.visitors(from, to);
  }

  @Get('events')
  events(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<EventReportRow[]> {
    return this.reportsService.events(from, to);
  }
}

function parseGroupBy(value?: string): SalesGroupBy {
  if (!value) return 'day';
  if (!SALES_GROUP_BY.includes(value as SalesGroupBy)) {
    throw new BadRequestException(
      `groupBy must be one of: ${SALES_GROUP_BY.join(', ')}`,
    );
  }
  return value as SalesGroupBy;
}
