import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { type Event } from '../../shared/database/schema';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreateEventDto, type EventType } from './dto/create-event.dto';
import { type LocationType } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService, type EventDetail } from './events.service';

/** Park-wide event management — any park staff manages every event. */
@Controller('events')
@Roles(Role.Admin, Role.ParkStaff)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(
    @Query('eventType') eventType?: EventType,
    @Query('locationType') locationType?: LocationType,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
  ): Promise<Event[]> {
    return this.eventsService.listAll({ eventType, locationType, isActive });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EventDetail> {
    return this.eventsService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateEventDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Event> {
    return this.eventsService.create(dto, currentUser.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Event> {
    return this.eventsService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.eventsService.remove(id, currentUser.id);
  }
}
