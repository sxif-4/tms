import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import {
  type FerryBooking,
  type FerryRoute,
  type FerrySchedule,
} from '../../shared/database/schema';
import { CreateFerryBookingDto } from './dto/create-ferry-booking.dto';
import { CreateFerryRouteDto } from './dto/create-ferry-route.dto';
import { CreateFerryScheduleDto } from './dto/create-ferry-schedule.dto';
import { UpdateFerryBookingDto } from './dto/update-ferry-booking.dto';
import { UpdateFerryRouteDto } from './dto/update-ferry-route.dto';
import { UpdateFerryScheduleDto } from './dto/update-ferry-schedule.dto';
import { FerryService } from './ferry.service';
import { type HotelBookingOptionRow } from './ferry.repository';

/**
 * Route/schedule browsing is open to any authenticated user; every write and
 * the booking queue itself are restricted to ferry staff/admin below.
 */
@Controller('ferry')
@Roles(Role.Admin, Role.FerryStaff)
export class FerryController {
  constructor(private readonly ferryService: FerryService) {}

  @Get('routes')
  @Roles()
  listRoutes(): Promise<FerryRoute[]> {
    return this.ferryService.listRoutes();
  }

  @Get('routes/:id')
  @Roles()
  getRouteById(@Param('id', ParseIntPipe) id: number): Promise<FerryRoute> {
    return this.ferryService.getRouteById(id);
  }

  @Post('routes')
  createRoute(
    @Body() dto: CreateFerryRouteDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerryRoute> {
    return this.ferryService.createRoute(currentUser, dto);
  }

  @Patch('routes/:id')
  updateRoute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFerryRouteDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerryRoute> {
    return this.ferryService.updateRoute(currentUser, id, dto);
  }

  @Delete('routes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRoute(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.ferryService.removeRoute(currentUser, id);
  }

  @Get('schedules')
  @Roles()
  listSchedules(): Promise<FerrySchedule[]> {
    return this.ferryService.listSchedules();
  }

  @Get('schedules/:id')
  @Roles()
  getScheduleById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FerrySchedule> {
    return this.ferryService.getScheduleById(id);
  }

  @Post('schedules')
  createSchedule(
    @Body() dto: CreateFerryScheduleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerrySchedule> {
    return this.ferryService.createSchedule(currentUser, dto);
  }

  @Patch('schedules/:id')
  updateSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFerryScheduleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerrySchedule> {
    return this.ferryService.updateSchedule(currentUser, id, dto);
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSchedule(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.ferryService.removeSchedule(currentUser, id);
  }

  @Get('users/:userId/hotel-bookings')
  listHotelBookingsForUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<HotelBookingOptionRow[]> {
    return this.ferryService.listHotelBookingsForUser(userId);
  }

  @Get('bookings')
  listBookings(): Promise<FerryBooking[]> {
    return this.ferryService.listBookings();
  }

  @Get('bookings/:id')
  getBookingById(@Param('id', ParseIntPipe) id: number): Promise<FerryBooking> {
    return this.ferryService.getBookingById(id);
  }

  @Post('bookings')
  createBooking(
    @Body() dto: CreateFerryBookingDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerryBooking> {
    return this.ferryService.createBooking(currentUser, dto);
  }

  @Patch('bookings/:id')
  updateBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFerryBookingDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerryBooking> {
    return this.ferryService.updateBooking(currentUser, id, dto);
  }

  @Delete('bookings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeBooking(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.ferryService.removeBooking(currentUser, id);
  }
}
