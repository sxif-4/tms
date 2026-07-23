import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { UpsertParkDayDto } from './dto/upsert-park-day.dto';
import { ParkDaysService, type ParkDayView } from './park-days.service';

/**
 * Per-day ticket availability. Keyed by date (`2026-07-15`), not by row id —
 * staff think in days, and the override row is an implementation detail.
 */
@Controller('park-days')
@Roles(Role.Admin, Role.ParkStaff)
export class ParkDaysController {
  constructor(private readonly parkDaysService: ParkDaysService) {}

  @Get()
  findRange(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<ParkDayView[]> {
    return this.parkDaysService.listRange(from, to);
  }

  @Put(':date')
  upsert(
    @Param('date') date: string,
    @Body() dto: UpsertParkDayDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ParkDayView> {
    return this.parkDaysService.upsert(date, dto, currentUser.id);
  }

  @Delete(':date')
  @HttpCode(HttpStatus.NO_CONTENT)
  clear(
    @Param('date') date: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.parkDaysService.clear(date, currentUser.id);
  }
}
