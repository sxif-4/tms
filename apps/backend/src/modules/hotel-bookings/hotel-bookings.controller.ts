import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { AssignRoomDto } from './dto/assign-room.dto';
import { CreateHotelBookingDto } from './dto/create-hotel-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import {
  HotelBookingsService,
} from './hotel-bookings.service';
import { type HotelBookingRow } from './hotel-bookings.repository';

/**
 * Staff management (scoped to assigned hotels) plus the two visitor-facing
 * actions — creating a booking and listing "mine" — live in the same
 * controller since they share the `hotel-bookings` resource. Per-route
 * `@Roles()` overrides open just those two to any authenticated user.
 */
@Controller('hotel-bookings')
@Roles(Role.Admin, Role.HotelStaff)
export class HotelBookingsController {
  constructor(private readonly bookingsService: HotelBookingsService) {}

  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('hotelId') hotelId?: string,
    @Query('status') status?: string,
  ): Promise<HotelBookingRow[]> {
    return this.bookingsService.listScoped(currentUser, {
      hotelId: hotelId ? Number(hotelId) : undefined,
      status,
    });
  }

  @Get('mine')
  @Roles()
  findMine(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<HotelBookingRow[]> {
    return this.bookingsService.getMine(currentUser.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<HotelBookingRow> {
    return this.bookingsService.getById(currentUser, id);
  }

  @Post()
  @Roles()
  create(
    @Body() dto: CreateHotelBookingDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<HotelBookingRow> {
    return this.bookingsService.create(currentUser, dto);
  }

  @Patch(':id/assign-room')
  assignRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRoomDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<HotelBookingRow> {
    return this.bookingsService.assignRoom(currentUser, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<HotelBookingRow> {
    return this.bookingsService.updateStatus(currentUser, id, dto);
  }
}
