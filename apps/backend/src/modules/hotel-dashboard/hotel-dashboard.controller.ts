import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import {
  HotelDashboardService,
  type HotelDashboardResponse,
} from './hotel-dashboard.service';

/** Aggregated KPIs, trends and priority actions for one hotel at a time. */
@Controller('hotel-dashboard')
@Roles(Role.Admin, Role.HotelStaff)
export class HotelDashboardController {
  constructor(private readonly dashboardService: HotelDashboardService) {}

  @Get()
  get(
    @Query('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<HotelDashboardResponse> {
    return this.dashboardService.getDashboard(currentUser, hotelId);
  }
}
