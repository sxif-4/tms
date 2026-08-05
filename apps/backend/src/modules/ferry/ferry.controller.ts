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
import {
  CreateFerryBookingDto,
  CreateOwnFerryBookingDto,
} from './dto/create-ferry-booking.dto';
import { CreateFerryRouteDto } from './dto/create-ferry-route.dto';
import { CreateFerryScheduleDto } from './dto/create-ferry-schedule.dto';
import { UpdateFerryBookingDto } from './dto/update-ferry-booking.dto';
import { UpdateFerryRouteDto } from './dto/update-ferry-route.dto';
import { UpdateFerryScheduleDto } from './dto/update-ferry-schedule.dto';
import { ValidateFerryPassDto } from './dto/validate-ferry-pass.dto';
import {
  FERRY_BOOKING_STATUSES,
  FerryService,
  type FerryManifest,
  type FerryPass,
} from './ferry.service';
import {
  type FerryBookingRow,
  type FerryScheduleRow,
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
  listSchedules(
    @Query('routeId') routeId?: string,
    @Query('direction') direction?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<FerryScheduleRow[]> {
    return this.ferryService.listSchedules({
      routeId: parseId(routeId, 'routeId'),
      direction: parseDirection(direction),
      from: parseDate(from, 'from'),
      to: parseDate(to, 'to'),
    });
  }

  /** What a visitor may actually book: scheduled, still ahead, still has seats. */
  @Get('schedules/bookable')
  @Roles()
  listBookableSchedules(
    @Query('routeId') routeId?: string,
    @Query('direction') direction?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<FerryScheduleRow[]> {
    return this.ferryService.listBookableSchedules({
      routeId: parseId(routeId, 'routeId'),
      direction: parseDirection(direction),
      from: parseDate(from, 'from'),
      to: parseDate(to, 'to'),
    });
  }

  /** The signed-in visitor's own eligible stays — no userId in the path to forge. */
  @Get('my-hotel-bookings')
  @Roles()
  listMyHotelBookings(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<HotelBookingOptionRow[]> {
    return this.ferryService.listHotelBookingsForUser(currentUser.id);
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

  /** The boarding list for one sailing. Staff-only — it names every passenger. */
  @Get('schedules/:id/manifest')
  getManifest(@Param('id', ParseIntPipe) id: number): Promise<FerryManifest> {
    return this.ferryService.getManifest(id);
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

  /** The signed-in visitor's own ferry bookings. */
  @Get('bookings/mine')
  @Roles()
  listMyBookings(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerryBookingRow[]> {
    return this.ferryService.listMyBookings(currentUser.id);
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

  /** Staff or the owner — a visitor must be able to show their own pass. */
  @Get('bookings/:id/pass')
  @Roles()
  getPass(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerryPass> {
    return this.ferryService.getPassFor(currentUser, id);
  }

  /**
   * Visitor self-service. The passenger comes from the JWT, so a visitor can
   * only ever book against their own stay.
   */
  @Post('bookings')
  @Roles()
  createOwnBooking(
    @Body() dto: CreateOwnFerryBookingDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FerryBooking> {
    return this.ferryService.createOwnBooking(currentUser, dto);
  }

  /** Counter booking: staff taking a request on a named guest's behalf. */
  @Post('bookings/manual')
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

  /** Staff cancel anyone's; a visitor only their own (checked in the service). */
  @Post('bookings/:id/cancel')
  @Roles()
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

const FERRY_DIRECTIONS = ['to_theme_park', 'to_island'] as const;
type FerryDirection = (typeof FERRY_DIRECTIONS)[number];

function parseDirection(value?: string): FerryDirection | undefined {
  if (!value) return undefined;
  if (!FERRY_DIRECTIONS.includes(value as FerryDirection)) {
    throw new BadRequestException(
      `direction must be one of: ${FERRY_DIRECTIONS.join(', ')}`,
    );
  }
  return value as FerryDirection;
}

function parseDate(value: string | undefined, field: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} must be a valid date`);
  }
  return parsed;
}
