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
import { CreateEventScheduleDto } from './dto/create-event-schedule.dto';
import { UpdateEventScheduleDto } from './dto/update-event-schedule.dto';
import {
  EventSchedulesService,
  type EventScheduleView,
} from './event-schedules.service';

/** When each event runs, and how many seats it has. Child rows of `events`. */
@Controller('event-schedules')
@Roles(Role.Admin, Role.ParkStaff)
export class EventSchedulesController {
  constructor(private readonly schedulesService: EventSchedulesService) {}

  @Get()
  findAll(
    @Query('eventId', new ParseIntPipe({ optional: true })) eventId?: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<EventScheduleView[]> {
    return this.schedulesService.listAll({
      eventId,
      from: parseRangeDate(from, 'from'),
      to: parseRangeDate(to, 'to'),
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EventScheduleView> {
    return this.schedulesService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateEventScheduleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<EventScheduleView> {
    return this.schedulesService.create(dto, currentUser.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventScheduleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<EventScheduleView> {
    return this.schedulesService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.schedulesService.remove(id, currentUser.id);
  }
}

/** Query dates are free-form strings; reject junk rather than silently filtering on `Invalid Date`. */
function parseRangeDate(
  value: string | undefined,
  field: string,
): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`"${field}" must be a valid date`);
  }
  return date;
}
