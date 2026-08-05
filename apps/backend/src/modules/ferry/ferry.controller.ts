import {
  BadRequestException,
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
  Query,
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
import { ValidateFerryPassDto } from './dto/validate-ferry-pass.dto';
import {
  FERRY_BOOKING_STATUSES,
  FerryService,
  type FerryPass,
} from './ferry.service';
import {
  type FerryBookingRow,
  type HotelBookingOptionRow,
} from './ferry.repository';

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
  listBookings(
    @Query('status') status?: string,
    @Query('scheduleId') scheduleId?: string,
    @Query('routeId') routeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
  ): Promise<FerryBookingRow[]> {
    return this.ferryService.listBookings({
      status: parseStatus(status),
      scheduleId: parseId(scheduleId, 'scheduleId'),
      routeId: parseId(routeId, 'routeId'),
      from: parseDate(from, 'from'),
      to: parseDate(to, 'to'),
      q: q?.trim() || undefined,
    });
  }

  // Declared before `bookings/:id` reads naturally, though the extra path
  // segment already keeps the two from colliding.
  @Get('bookings/lookup/:reference')
  lookup(@Param('reference') reference: string): Promise<FerryBookingRow> {
    return this.ferryService.lookup(reference);
  }

  @Get('bookings/:id')
  getBookingById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FerryBookingRow> {
    return this.ferryService.getBookingRowById(id);
  }

  @Get('bookings/:id/pass')
  getPass(@Param('id', ParseIntPipe) id: number): Promise<FerryPass> {
    return this.ferryService.getPass(id);
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

  /** Issues the ferry pass: pending → confirmed, and takes the fare. */
  @Post('bookings/:id/issue')
  @HttpCode(HttpStatus.OK)
  issue(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerryPass> {
    return this.ferryService.issue(currentUser, id);
  }

  // Boarding mutates an existing booking rather than creating anything, so this
  // answers 200, not Nest's default 201 for POST.
  @Post('bookings/validate')
  @HttpCode(HttpStatus.OK)
  validate(
    @Body() dto: ValidateFerryPassDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerryBookingRow> {
    return this.ferryService.validate(currentUser, dto);
  }

  @Post('bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerryBookingRow> {
    return this.ferryService.cancel(currentUser, id);
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

type FerryBookingStatus = (typeof FERRY_BOOKING_STATUSES)[number];

function parseStatus(value?: string): FerryBookingStatus | undefined {
  if (!value) return undefined;
  if (!FERRY_BOOKING_STATUSES.includes(value as FerryBookingStatus)) {
    throw new BadRequestException(
      `status must be one of: ${FERRY_BOOKING_STATUSES.join(', ')}`,
    );
  }
  return value as FerryBookingStatus;
}

function parseId(value: string | undefined, field: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return parsed;
}

function parseDate(value: string | undefined, field: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} must be a valid date`);
  }
  return parsed;
}
