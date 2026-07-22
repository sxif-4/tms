import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ParkDaysService } from '../park-days/park-days.service';
import {
  PublicParkRepository,
  type PublicEvent,
  type PublicEventFilters,
  type PublicSchedule,
  type PublicTicketType,
} from './public-park.repository';

export interface PublicEventDetail extends PublicEvent {
  schedules: PublicSchedule[];
}

/** What the date picker needs — and nothing else. Capacity/sold stay internal. */
export interface PublicDayAvailability {
  date: string;
  remaining: number;
  isClosed: boolean;
}

@Injectable()
export class PublicParkService {
  constructor(
    private readonly parkRepo: PublicParkRepository,
    private readonly parkDays: ParkDaysService,
  ) {}

  ticketTypes(): Promise<PublicTicketType[]> {
    return this.parkRepo.ticketTypes();
  }

  events(filters: PublicEventFilters): Promise<PublicEvent[]> {
    return this.parkRepo.activeEvents(filters);
  }

  async eventDetail(id: number): Promise<PublicEventDetail> {
    const event = await this.parkRepo.activeEventById(id);
    if (!event) throw new NotFoundException(`Event #${id} not found`);
    const schedules = await this.parkRepo.upcomingSchedules(id);
    return { ...event, schedules };
  }

  /**
   * Per-day availability for the booking date picker. Deliberately narrowed
   * from the staff calendar: a visitor sees how many tickets are left and
   * whether the park is shut, not the park's capacity or its takings.
   */
  async availability(
    from?: string,
    to?: string,
  ): Promise<PublicDayAvailability[]> {
    if ((from && !to) || (!from && to)) {
      throw new BadRequestException(
        '"from" and "to" must be provided together',
      );
    }
    const days = await this.parkDays.listRange(from, to);
    return days.map((day) => ({
      date: day.date,
      remaining: day.remaining,
      isClosed: day.isClosed,
    }));
  }
}
