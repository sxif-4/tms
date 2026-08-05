import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { type Event } from '../../shared/database/schema';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { ImagesRepository } from '../../shared/images/images.repository';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsRepository, type EventFilters } from './events.repository';

/** `imageables.imageable_type` for event photo galleries. */
const IMAGE_OWNER_TYPE = 'event';

/** An event plus its gallery — `image` is the cover, or `null` until one exists. */
export type EventWithImages = Event & {
  image: string | null;
  images: string[];
};

export interface EventDetail extends EventWithImages {
  scheduleCount: number;
}

/** Rides, shows and beach events. Park-wide — no per-event staff scoping. */
@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepo: EventsRepository,
    private readonly audit: AuditService,
    private readonly imagesRepo: ImagesRepository,
  ) {}

  async listAll(filters: EventFilters): Promise<EventWithImages[]> {
    const events = await this.eventsRepo.findAll(filters);
    const byEvent = this.imagesRepo.findForOwners(
      IMAGE_OWNER_TYPE,
      events.map((e) => e.id),
    );
    return events.map((e) => {
      const imgs = byEvent.get(e.id) ?? [];
      return {
        ...e,
        image: imgs[0]?.url ?? null,
        images: imgs.map((i) => i.url),
      };
    });
  }

  async findById(id: number): Promise<EventDetail> {
    const event = await this.eventsRepo.findById(id);
    if (!event) throw new NotFoundException(`Event #${id} not found`);
    const scheduleCount = await this.eventsRepo.countSchedules(id);
    const imgs = await this.imagesRepo.findForOwner(IMAGE_OWNER_TYPE, id);
    return {
      ...event,
      scheduleCount,
      image: imgs[0]?.url ?? null,
      images: imgs.map((i) => i.url),
    };
  }

  async create(dto: CreateEventDto, actorId: number): Promise<Event> {
    const event = await this.eventsRepo.create({
      name: dto.name,
      description: dto.description,
      eventType: dto.eventType,
      locationType: dto.locationType,
      basePrice: dto.basePrice,
      isActive: dto.isActive ?? true,
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.EventCreated,
      subjectType: 'Event',
      subjectId: event.id,
      metadata: { name: event.name, eventType: event.eventType },
    });
    return event;
  }

  async update(
    id: number,
    dto: UpdateEventDto,
    actorId: number,
  ): Promise<Event> {
    await this.findById(id); // 404 if missing

    const updated = await this.eventsRepo.update(id, dto);
    if (!updated) throw new NotFoundException(`Event #${id} not found`);

    await this.audit.record({
      userId: actorId,
      action: AuditAction.EventUpdated,
      subjectType: 'Event',
      subjectId: id,
    });
    return updated;
  }

  async remove(id: number, actorId: number): Promise<void> {
    const event = await this.findById(id);

    // Schedules (and the bookings behind them) would be orphaned. Retiring an
    // event is what `isActive: false` is for.
    if (event.scheduleCount > 0) {
      throw new ConflictException(
        `Cannot delete "${event.name}" — it has ${event.scheduleCount} schedule(s). Set isActive: false to retire it instead`,
      );
    }

    await this.eventsRepo.delete(id);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.EventDeleted,
      subjectType: 'Event',
      subjectId: id,
      metadata: { name: event.name },
    });
  }
}
