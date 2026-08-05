import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import {
  FerryReportsService,
  PERIOD_BUCKETS,
  type FerryRouteReportView,
  type FerrySalesRow,
  type FerryTripReportRow,
  type PeriodBucket,
} from './ferry-reports.service';

/** Aggregate-only ferry reporting — never guest names, emails or references. */
@Controller('ferry-reports')
@Roles(Role.Admin, Role.FerryStaff)
export class FerryReportsController {
  constructor(private readonly reportsService: FerryReportsService) {}

  @Get('sales')
  sales(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: string,
  ): Promise<FerrySalesRow[]> {
    return this.reportsService.sales(from, to, parseGroupBy(groupBy));
  }

  @Get('trips')
  trips(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('routeId') routeId?: string,
  ): Promise<FerryTripReportRow[]> {
    return this.reportsService.trips(from, to, parseRouteId(routeId));
  }

  @Get('routes')
  routes(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<FerryRouteReportView[]> {
    return this.reportsService.routes(from, to);
  }
}

function parseGroupBy(value?: string): PeriodBucket {
  if (!value) return 'day';
  if (!PERIOD_BUCKETS.includes(value as PeriodBucket)) {
    throw new BadRequestException(
      `groupBy must be one of: ${PERIOD_BUCKETS.join(', ')}`,
    );
  }
  return value as PeriodBucket;
}

function parseRouteId(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException('routeId must be a positive integer');
  }
  return parsed;
}
