import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { EVENT_TYPES, LOCATION_TYPES } from '../events/dto/create-event.dto';
import {
  PublicParkService,
  type PublicDayAvailability,
  type PublicEventDetail,
} from './public-park.service';
import type { PublicEvent, PublicTicketType } from './public-park.repository';

/**
 * Unauthenticated park browsing — the pages a visitor sees before logging in.
 * Nothing here exposes buyer names, emails or ticket references.
 */
@Controller('public/park')
@Public()
@Roles()
export class PublicParkController {
  constructor(private readonly parkService: PublicParkService) {}

  @Get('ticket-types')
  ticketTypes(): Promise<PublicTicketType[]> {
    return this.parkService.ticketTypes();
  }

  @Get('events')
  events(
    @Query('eventType') eventType?: string,
    @Query('locationType') locationType?: string,
  ): Promise<PublicEvent[]> {
    return this.parkService.events({
      eventType: oneOf(eventType, EVENT_TYPES, 'eventType'),
      locationType: oneOf(locationType, LOCATION_TYPES, 'locationType'),
    });
  }

  @Get('events/:id')
  eventDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PublicEventDetail> {
    return this.parkService.eventDetail(id);
  }

  @Get('availability')
  availability(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<PublicDayAvailability[]> {
    return this.parkService.availability(from, to);
  }
}

/** Narrows a raw query string to one of `allowed`, 400ing on anything else. */
function oneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  field: string,
): T | undefined {
  if (!value) return undefined;
  if (!allowed.includes(value as T)) {
    throw new BadRequestException(
      `${field} must be one of: ${allowed.join(', ')}`,
    );
  }
  return value as T;
}
