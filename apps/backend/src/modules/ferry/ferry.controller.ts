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
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import {
  type FerryBooking,
  type FerryRoute,
  type FerrySchedule,
} from '../../shared/database/schema';
import { CreateFerryBookingDto } from './dto/create-ferry-booking.dto';
import { CreateFerryRouteDto } from './dto/create-ferry-route.dto';
import { CreateFerryScheduleDto } from './dto/create-ferry-schedule.dto';
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
  createRoute(@Body() dto: CreateFerryRouteDto): Promise<FerryRoute> {
    return this.ferryService.createRoute(dto);
  }

  @Patch('routes/:id')
  updateRoute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFerryRouteDto,
  ): Promise<FerryRoute> {
    return this.ferryService.updateRoute(id, dto);
  }

  @Delete('routes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRoute(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ferryService.removeRoute(id);
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
  createSchedule(@Body() dto: CreateFerryScheduleDto): Promise<FerrySchedule> {
    return this.ferryService.createSchedule(dto);
  }

  @Patch('schedules/:id')
  updateSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFerryScheduleDto,
  ): Promise<FerrySchedule> {
    return this.ferryService.updateSchedule(id, dto);
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSchedule(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ferryService.removeSchedule(id);
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
  createBooking(@Body() dto: CreateFerryBookingDto): Promise<FerryBooking> {
    return this.ferryService.createBooking(dto);
  }

  @Patch('bookings/:id')
  updateBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateFerryBookingDto>,
  ): Promise<FerryBooking> {
    return this.ferryService.updateBooking(id, dto);
  }

  @Delete('bookings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeBooking(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ferryService.removeBooking(id);
  }
}
