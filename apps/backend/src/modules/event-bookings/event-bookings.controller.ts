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
import { CreateEventBookingDto } from './dto/create-event-booking.dto';
import { UpdateEventBookingStatusDto } from './dto/update-event-booking-status.dto';
import {
  type EventBookingRow,
  type EventBookingStatus,
} from './event-bookings.repository';
import { EventBookingsService } from './event-bookings.service';

/**
 * Staff management plus the visitor actions (book, list mine), opened by bare
 * `@Roles()` overrides. `/mine` is declared before `/:id` so Nest doesn't try
 * to parse "mine" as an id.
 */
@Controller('event-bookings')
@Roles(Role.Admin, Role.ParkStaff)
export class EventBookingsController {
  constructor(private readonly bookingsService: EventBookingsService) {}

  @Get()
  findAll(
    @Query('eventId', new ParseIntPipe({ optional: true })) eventId?: number,
    @Query('scheduleId', new ParseIntPipe({ optional: true }))
    scheduleId?: number,
    @Query('status') status?: EventBookingStatus,
  ): Promise<EventBookingRow[]> {
    return this.bookingsService.listAll({ eventId, scheduleId, status });
  }

  @Get('mine')
  @Roles()
  findMine(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<EventBookingRow[]> {
    return this.bookingsService.getMine(currentUser.id);
  }

  @Post()
  @Roles()
  create(
    @Body() dto: CreateEventBookingDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<EventBookingRow> {
    return this.bookingsService.create(currentUser, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EventBookingRow> {
    return this.bookingsService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventBookingStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<EventBookingRow> {
    return this.bookingsService.updateStatus(currentUser, id, dto);
  }
}
