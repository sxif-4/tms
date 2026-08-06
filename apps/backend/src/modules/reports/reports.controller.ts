import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import { type OperationsRow, type OverviewRow } from './reports.repository';
import {
  ReportsService,
  type OccupancyPoint,
  type SalesPoint,
  type ScheduleFillPoint,
  type UsagePoint,
} from './reports.service';

/** Admin-only read-only reporting endpoints. */
@Controller('reports')
@Roles(Role.Admin)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  overview(): Promise<OverviewRow> {
    return this.reportsService.overview();
  }

  @Get('sales')
  sales(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<SalesPoint[]> {
    return this.reportsService.sales(from, to);
  }

  @Get('usage')
  usage(): Promise<UsagePoint[]> {
    return this.reportsService.usage();
  }

  /** Attention tiles for the admin overview. */
  @Get('operations')
  operations(): Promise<OperationsRow> {
    return this.reportsService.operations();
  }

  /** Forward occupancy per hotel, busiest first. */
  @Get('occupancy')
  occupancy(): Promise<OccupancyPoint[]> {
    return this.reportsService.occupancy();
  }

  /** Sailings and events departing in the next week. */
  @Get('schedule-fill')
  scheduleFill(): Promise<ScheduleFillPoint[]> {
    return this.reportsService.scheduleFill();
  }
}
