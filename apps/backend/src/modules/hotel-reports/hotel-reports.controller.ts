import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import {
  HotelReportsService,
} from './hotel-reports.service';
import type { OccupancyPoint, RevenuePoint } from './hotel-reports.repository';

/** Aggregate-only revenue/occupancy trends for one hotel — never guest identifiers. */
@Controller('hotel-reports')
@Roles(Role.Admin, Role.HotelStaff)
export class HotelReportsController {
  constructor(private readonly reportsService: HotelReportsService) {}

  @Get('revenue')
  revenue(
    @Query('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<RevenuePoint[]> {
    return this.reportsService.revenue(currentUser, hotelId, from, to);
  }

  @Get('occupancy')
  occupancy(
    @Query('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<OccupancyPoint[]> {
    return this.reportsService.occupancy(currentUser, hotelId, from, to);
  }
}
