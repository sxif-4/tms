import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  parkTickets,
  parkTicketTypes,
  type NewParkTicketType,
  type ParkTicketType,
} from '../../shared/database/schema';

/** Sole owner of Drizzle queries for the park ticket-type catalog. */
@Injectable()
export class ParkTicketTypesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(): Promise<ParkTicketType[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(parkTicketTypes)
        .orderBy(asc(parkTicketTypes.name))
        .all(),
    );
  }

  findById(id: number): Promise<ParkTicketType | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(parkTicketTypes)
        .where(eq(parkTicketTypes.id, id))
        .get(),
    );
  }

  create(data: NewParkTicketType): Promise<ParkTicketType> {
    return Promise.resolve(
      this.db.insert(parkTicketTypes).values(data).returning().get(),
    );
  }

  update(
    id: number,
    data: Partial<NewParkTicketType>,
  ): Promise<ParkTicketType | undefined> {
    return Promise.resolve(
      this.db
        .update(parkTicketTypes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(parkTicketTypes.id, id))
        .returning()
        .get(),
    );
  }

  delete(id: number): Promise<void> {
    this.db.delete(parkTicketTypes).where(eq(parkTicketTypes.id, id)).run();
    return Promise.resolve();
  }

  /** How many tickets were ever sold against this type — blocks deletion (price snapshots must stay resolvable). */
  countTicketsUsingType(ticketTypeId: number): Promise<number> {
    const row = this.db
      .select({ count: sql<number>`count(*)` })
      .from(parkTickets)
      .where(eq(parkTickets.ticketTypeId, ticketTypeId))
      .get();
    return Promise.resolve(row?.count ?? 0);
  }
}
