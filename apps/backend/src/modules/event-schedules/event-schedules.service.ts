import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { EventsRepository } from '../events/events.repository';
import { CreateEventScheduleDto } from './dto/create-event-schedule.dto';
import { UpdateEventScheduleDto } from './dto/update-event-schedule.dto';
import {
  EventSchedulesRepository,
  type EventScheduleFilters,
  type EventScheduleRow,
} from './event-schedules.repository';

/** A schedule row as the API returns it — `remaining` is derived, never stored. */
export interface EventScheduleView extends EventScheduleRow {
  remaining: number;
}

@Injectable()
export class EventSchedulesService {
  constructor(
    private readonly schedulesRepo: EventSchedulesRepository,
    private readonly eventsRepo: EventsRepository,
    private readonly audit: AuditService,
  ) {}

  async listAll(filters: EventScheduleFilters): Promise<EventScheduleView[]> {
    const rows = await this.schedulesRepo.findAll(filters);
    return rows.map((row) => this.withRemaining(row));
  }

  async findById(id: number): Promise<EventScheduleView> {
    const row = await this.schedulesRepo.findRowById(id);
    if (!row) throw new NotFoundException(`Event schedule #${id} not found`);
    return this.withRemaining(row);
  }

  async create(
    dto: CreateEventScheduleDto,
    actorId: number,
  ): Promise<EventScheduleView> {
    const event = await this.eventsRepo.findById(dto.eventId);
    if (!event) {
      throw new NotFoundException(`Event #${dto.eventId} not found`);
    }

    const startAt = new Date(dto.startAt);
    if (startAt.getTime() <= Date.now()) {
      throw new BadRequestException('startAt must be in the future');
    }

    const schedule = await this.schedulesRepo.create({
      eventId: dto.eventId,
      startAt,
      capacity: dto.capacity,
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.EventScheduleCreated,
      subjectType: 'EventSchedule',
      subjectId: schedule.id,
      metadata: {
        eventId: schedule.eventId,
        startAt: schedule.startAt.toISOString(),
        capacity: schedule.capacity,
      },
    });
    return this.findById(schedule.id);
  }

  async update(
    id: number,
    dto: UpdateEventScheduleDto,
    actorId: number,
  ): Promise<EventScheduleView> {
    const current = await this.findById(id); // 404 if missing

    // Shrinking capacity below what's already sold would strand those bookings.
    if (dto.capacity !== undefined && dto.capacity < current.booked) {
      throw new BadRequestException(
        `Capacity cannot be below the ${current.booked} seat(s) already booked`,
      );
    }

    const startAt = dto.startAt ? new Date(dto.startAt) : undefined;
    if (startAt && startAt.getTime() <= Date.now()) {
      throw new BadRequestException('startAt must be in the future');
    }

    const updated = await this.schedulesRepo.update(id, {
      ...(startAt && { startAt }),
      ...(dto.capacity !== undefined && { capacity: dto.capacity }),
    });
    if (!updated)
      throw new NotFoundException(`Event schedule #${id} not found`);

    await this.audit.record({
      userId: actorId,
      action: AuditAction.EventScheduleUpdated,
      subjectType: 'EventSchedule',
      subjectId: id,
    });
    return this.findById(id);
  }

  async remove(id: number, actorId: number): Promise<void> {
    const schedule = await this.findById(id); // 404 if missing

    const bookings = await this.schedulesRepo.countBookings(id);
    if (bookings > 0) {
      throw new ConflictException(
        `Cannot delete a schedule with ${bookings} booking(s)`,
      );
    }

    await this.schedulesRepo.delete(id);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.EventScheduleDeleted,
      subjectType: 'EventSchedule',
      subjectId: id,
      metadata: { eventId: schedule.eventId },
    });
  }

  private withRemaining(row: EventScheduleRow): EventScheduleView {
    return { ...row, remaining: Math.max(0, row.capacity - row.booked) };
  }
}
