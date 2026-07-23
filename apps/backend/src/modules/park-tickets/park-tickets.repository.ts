import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, like, lt, or, type SQL } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { alias } from 'drizzle-orm/sqlite-core';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  parkTicketTypes,
  parkTickets,
  payments,
  users,
  type NewParkTicket,
  type ParkTicket,
} from '../../shared/database/schema';

export type ParkTicketStatus = 'active' | 'used' | 'cancelled' | 'refunded';
export type ParkTicketChannel = 'online' | 'gate';

export interface ParkTicketRow {
  id: number;
  ticketReference: string;
  userId: number;
  buyerName: string;
  buyerEmail: string;
  ticketTypeId: number;
  ticketTypeName: string;
  visitDate: Date;
  quantity: number;
  totalAmount: string;
  channel: ParkTicketChannel;
  soldByUserId: number | null;
  soldByName: string | null;
  status: ParkTicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkTicketFilters {
  visitDate?: Date;
  status?: ParkTicketStatus;
  channel?: ParkTicketChannel;
  /** Free-text over ticket reference, buyer name and buyer email. */
  q?: string;
}

// `sold_by_user_id` points at users too, so the staff join needs its own alias.
const soldBy = alias(users, 'sold_by');

const rowSelection = {
  id: parkTickets.id,
  ticketReference: parkTickets.ticketReference,
  userId: parkTickets.userId,
  buyerName: users.name,
  buyerEmail: users.email,
  ticketTypeId: parkTickets.ticketTypeId,
  ticketTypeName: parkTicketTypes.name,
  visitDate: parkTickets.visitDate,
  quantity: parkTickets.quantity,
  totalAmount: parkTickets.totalAmount,
  channel: parkTickets.channel,
  soldByUserId: parkTickets.soldByUserId,
  soldByName: soldBy.name,
  status: parkTickets.status,
  createdAt: parkTickets.createdAt,
  updatedAt: parkTickets.updatedAt,
} as const;

/** Sole owner of Drizzle queries for park tickets. */
@Injectable()
export class ParkTicketsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private joinedQuery() {
    return this.db
      .select(rowSelection)
      .from(parkTickets)
      .innerJoin(users, eq(parkTickets.userId, users.id))
      .innerJoin(
        parkTicketTypes,
        eq(parkTickets.ticketTypeId, parkTicketTypes.id),
      )
      .leftJoin(soldBy, eq(parkTickets.soldByUserId, soldBy.id));
  }

  findAll(filters: ParkTicketFilters = {}): Promise<ParkTicketRow[]> {
    const conditions: SQL[] = [];

    if (filters.visitDate) {
      // Match the calendar day, not the instant — see park-days.repository.
      conditions.push(gte(parkTickets.visitDate, filters.visitDate));
      conditions.push(lt(parkTickets.visitDate, dayAfter(filters.visitDate)));
    }
    if (filters.status) {
      conditions.push(eq(parkTickets.status, filters.status));
    }
    if (filters.channel) {
      conditions.push(eq(parkTickets.channel, filters.channel));
    }
    if (filters.q) {
      const term = `%${filters.q}%`;
      const search = or(
        like(parkTickets.ticketReference, term),
        like(users.name, term),
        like(users.email, term),
      );
      if (search) conditions.push(search);
    }

    return Promise.resolve(
      this.joinedQuery()
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(parkTickets.createdAt))
        .all(),
    );
  }

  findRowById(id: number): Promise<ParkTicketRow | undefined> {
    return Promise.resolve(
      this.joinedQuery().where(eq(parkTickets.id, id)).get(),
    );
  }

  findRowByReference(reference: string): Promise<ParkTicketRow | undefined> {
    return Promise.resolve(
      this.joinedQuery()
        .where(eq(parkTickets.ticketReference, reference))
        .get(),
    );
  }

  findByUserId(userId: number): Promise<ParkTicketRow[]> {
    return Promise.resolve(
      this.joinedQuery()
        .where(eq(parkTickets.userId, userId))
        .orderBy(desc(parkTickets.visitDate))
        .all(),
    );
  }

  /** Raw row — no joins. Used where only the ticket's own columns matter. */
  findById(id: number): Promise<ParkTicket | undefined> {
    return Promise.resolve(
      this.db.select().from(parkTickets).where(eq(parkTickets.id, id)).get(),
    );
  }

  create(data: NewParkTicket): Promise<ParkTicket> {
    return Promise.resolve(
      this.db.insert(parkTickets).values(data).returning().get(),
    );
  }

  updateStatus(id: number, status: ParkTicketStatus): Promise<void> {
    this.db
      .update(parkTickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(parkTickets.id, id))
      .run();
    return Promise.resolve();
  }

  /**
   * Mock payment — always succeeds, no processor is integrated (same approach as
   * hotel bookings). `payments` is the single source of sales truth, so every
   * ticket must land a row here or it vanishes from every revenue report.
   */
  recordMockPayment(input: {
    userId: number;
    payableId: number;
    amount: string;
    method: 'card' | 'cash';
  }): Promise<void> {
    this.db
      .insert(payments)
      .values({
        userId: input.userId,
        payableType: 'park_ticket',
        payableId: input.payableId,
        amount: input.amount,
        status: 'completed',
        method: input.method,
        paymentReference: randomUUID(),
        paidAt: new Date(),
      })
      .run();
    return Promise.resolve();
  }

  /** Marks the ticket's payment refunded, so revenue reports stop counting it. */
  refundPayment(ticketId: number): Promise<void> {
    this.db
      .update(payments)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(
        and(
          eq(payments.payableType, 'park_ticket'),
          eq(payments.payableId, ticketId),
        ),
      )
      .run();
    return Promise.resolve();
  }

  // No `soldOnDate` here on purpose: ParkDaysService owns the capacity rule
  // (default vs override vs closed), and sales gate on it. Two copies of that
  // arithmetic would eventually disagree, and the disagreement would be an
  // oversold day.
}

/** Exclusive upper bound for "this whole calendar day". */
function dayAfter(date: Date): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}
