import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { type ParkTicketType } from '../../shared/database/schema';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { CreateParkTicketTypeDto } from './dto/create-park-ticket-type.dto';
import { UpdateParkTicketTypeDto } from './dto/update-park-ticket-type.dto';
import { ParkTicketTypesRepository } from './park-ticket-types.repository';

/**
 * The priced catalog visitors buy from. There is only one theme park, so unlike
 * room types there is nothing to scope access by — any park staff manages the
 * whole catalog (see the park plan, decision 3).
 *
 * Editing a price is safe: tickets snapshot `total_amount` at purchase, so a
 * repricing never rewrites what someone was already charged.
 */
@Injectable()
export class ParkTicketTypesService {
  constructor(
    private readonly ticketTypesRepo: ParkTicketTypesRepository,
    private readonly audit: AuditService,
  ) {}

  listAll(): Promise<ParkTicketType[]> {
    return this.ticketTypesRepo.findAll();
  }

  async findById(id: number): Promise<ParkTicketType> {
    const ticketType = await this.ticketTypesRepo.findById(id);
    if (!ticketType) {
      throw new NotFoundException(`Park ticket type #${id} not found`);
    }
    return ticketType;
  }

  async create(
    dto: CreateParkTicketTypeDto,
    actorId: number,
  ): Promise<ParkTicketType> {
    const ticketType = await this.ticketTypesRepo.create({
      name: dto.name,
      price: dto.price,
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.ParkTicketTypeCreated,
      subjectType: 'ParkTicketType',
      subjectId: ticketType.id,
      metadata: { name: ticketType.name, price: ticketType.price },
    });
    return ticketType;
  }

  async update(
    id: number,
    dto: UpdateParkTicketTypeDto,
    actorId: number,
  ): Promise<ParkTicketType> {
    await this.findById(id); // 404 if missing

    const updated = await this.ticketTypesRepo.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Park ticket type #${id} not found`);
    }

    await this.audit.record({
      userId: actorId,
      action: AuditAction.ParkTicketTypeUpdated,
      subjectType: 'ParkTicketType',
      subjectId: id,
      metadata: { price: updated.price },
    });
    return updated;
  }

  async remove(id: number, actorId: number): Promise<void> {
    const ticketType = await this.findById(id);

    // Sold tickets keep an FK to their type; dropping it would orphan them.
    const ticketsSold = await this.ticketTypesRepo.countTicketsUsingType(id);
    if (ticketsSold > 0) {
      throw new ConflictException(
        `Cannot delete "${ticketType.name}" — ${ticketsSold} ticket(s) were sold against it`,
      );
    }

    await this.ticketTypesRepo.delete(id);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.ParkTicketTypeDeleted,
      subjectType: 'ParkTicketType',
      subjectId: id,
      metadata: { name: ticketType.name },
    });
  }
}
