import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import {
  ParkDashboardService,
  type ParkDashboardResponse,
} from './park-dashboard.service';

/**
 * One aggregate payload for the park-staff dashboard. Unlike the hotel
 * dashboard there is no `?hotelId=` — there is only one theme park, so park
 * staff see all of it (plan decision 3).
 */
@Controller('park-dashboard')
@Roles(Role.Admin, Role.ParkStaff)
export class ParkDashboardController {
  constructor(private readonly dashboardService: ParkDashboardService) {}

  @Get()
  get(): Promise<ParkDashboardResponse> {
    return this.dashboardService.getDashboard();
  }
}
