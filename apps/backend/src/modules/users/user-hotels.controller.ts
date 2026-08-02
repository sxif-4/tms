import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { AssignHotelDto } from './dto/assign-hotel.dto';
import { type AssignedHotel } from './user-assignments.repository';
import { UserAssignmentsService } from './user-assignments.service';

/**
 * Admin-only hotel scoping for staff accounts. Creating a `hotel_staff` user
 * isn't enough on its own — every hotel page reads `user_assignments`, so an
 * unassigned staff member sees an empty dashboard until an admin assigns them
 * a hotel here.
 */
@Controller('users/:userId/hotels')
@Roles(Role.Admin)
export class UserHotelsController {
  constructor(private readonly assignments: UserAssignmentsService) {}

  @Get()
  list(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<AssignedHotel[]> {
    return this.assignments.listHotels(userId);
  }

  @Post()
  assign(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AssignHotelDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AssignedHotel> {
    return this.assignments.assignHotel(userId, dto.hotelId, currentUser.id);
  }

  @Delete(':hotelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unassign(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.assignments.unassignHotel(userId, hotelId, currentUser.id);
  }
}
