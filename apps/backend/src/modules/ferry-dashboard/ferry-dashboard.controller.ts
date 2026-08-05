import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import {
  FerryDashboardService,
  type FerryDashboardResponse,
} from './ferry-dashboard.service';

/**
 * One aggregate payload for the ferry-staff dashboard. Like the park dashboard
 * there is no `?routeId=` — ferry staff are authorised network-wide, so they
 * see the whole operation (plan decision 4).
 */
@Controller('ferry-dashboard')
@Roles(Role.Admin, Role.FerryStaff)
export class FerryDashboardController {
  constructor(private readonly dashboardService: FerryDashboardService) {}

  @Get()
  get(): Promise<FerryDashboardResponse> {
    return this.dashboardService.getDashboard();
  }
}
