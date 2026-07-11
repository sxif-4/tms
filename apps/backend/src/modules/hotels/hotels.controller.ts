import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { type Hotel } from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { HotelsService } from './hotels.service';

/** Staff-facing hotel access, scoped to the user's assignments. */
@Controller('hotels')
@Roles(Role.Admin, Role.HotelStaff)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  findAll(@CurrentUser() currentUser: AuthenticatedUser): Promise<Hotel[]> {
    return this.hotelsService.listForUser(currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Hotel> {
    return this.hotelsService.getById(currentUser, id);
  }
}
