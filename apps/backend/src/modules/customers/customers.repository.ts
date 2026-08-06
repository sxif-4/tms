import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  eventBookings,
  ferryBookings,
  hotelBookings,
  parkTickets,
  payments,
  roles,
  users,
  type Payment,
} from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';

/** A customer as it appears in the admin search results. */
export interface CustomerSearchRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  /** Live bookings across every domain — what makes a row worth opening. */
  bookingCount: number;
}

/** A payment plus the reference of whatever it paid for. */
export interface CustomerPaymentRow extends Payment {
  payableReference: string | null;
}

/**
 * Sole owner of Drizzle queries for the admin customer lookup. Booking lists
 * themselves come from each domain's own repository — this one covers the
 * cross-domain bits no single domain owns: finding the customer, counting their
 * bookings, and their payment history.
 */
@Injectable()
export class CustomersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * Counts live (non-cancelled) bookings per user across all four domains.
   * Correlated subqueries rather than joins — joining four one-to-many tables
   * would multiply rows and inflate every count.
   */
  private bookingCountSql() {
    return sql<number>`(
      (SELECT COUNT(*) FROM ${hotelBookings}
        WHERE ${hotelBookings.userId} = ${users.id}
          AND ${hotelBookings.status} != 'cancelled')
      + (SELECT COUNT(*) FROM ${ferryBookings}
        WHERE ${ferryBookings.userId} = ${users.id}
          AND ${ferryBookings.status} != 'cancelled')
      + (SELECT COUNT(*) FROM ${eventBookings}
        WHERE ${eventBookings.userId} = ${users.id}
          AND ${eventBookings.status} != 'cancelled')
      + (SELECT COUNT(*) FROM ${parkTickets}
        WHERE ${parkTickets.userId} = ${users.id}
          AND ${parkTickets.status} NOT IN ('cancelled', 'refunded'))
    )`;
  }

  /**
   * Name/email search over visitors, newest first. An empty query returns the
   * most recently registered customers so the page has something to show.
   */
  search(
    query: string | undefined,
    limit: number,
  ): Promise<CustomerSearchRow[]> {
    const conditions = [eq(roles.slug, Role.Visitor)];

    const trimmed = query?.trim();
    if (trimmed) {
      conditions.push(
        or(
          like(users.name, `%${trimmed}%`),
          like(users.email, `%${trimmed}%`),
        )!,
      );
    }

    return Promise.resolve(
      this.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          isActive: users.isActive,
          createdAt: users.createdAt,
          bookingCount: this.bookingCountSql(),
        })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(and(...conditions))
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .all(),
    );
  }

  /**
   * Resolves a booking/ticket reference to the customer who owns it, so staff
   * can paste a reference from an email straight into the search box.
   */
  async findUserIdByReference(reference: string): Promise<number | undefined> {
    const ref = reference.trim();
    if (!ref) return undefined;

    const lookups = [
      this.db
        .select({ userId: hotelBookings.userId })
        .from(hotelBookings)
        .where(eq(hotelBookings.bookingReference, ref)),
      this.db
        .select({ userId: ferryBookings.userId })
        .from(ferryBookings)
        .where(eq(ferryBookings.bookingReference, ref)),
      this.db
        .select({ userId: eventBookings.userId })
        .from(eventBookings)
        .where(eq(eventBookings.bookingReference, ref)),
      this.db
        .select({ userId: parkTickets.userId })
        .from(parkTickets)
        .where(eq(parkTickets.ticketReference, ref)),
    ];

    for (const lookup of lookups) {
      const hit = lookup.get();
      if (hit) return Promise.resolve(hit.userId);
    }
    return Promise.resolve(undefined);
  }

  /**
   * A customer's payments, newest first, each carrying the reference of the
   * booking it paid for so the row is identifiable without a second lookup.
   */
  findPaymentsByUserId(userId: number): Promise<CustomerPaymentRow[]> {
    const payableReference = sql<string | null>`(
      CASE ${payments.payableType}
        WHEN 'hotel_booking' THEN (SELECT ${hotelBookings.bookingReference}
          FROM ${hotelBookings} WHERE ${hotelBookings.id} = ${payments.payableId})
        WHEN 'ferry_booking' THEN (SELECT ${ferryBookings.bookingReference}
          FROM ${ferryBookings} WHERE ${ferryBookings.id} = ${payments.payableId})
        WHEN 'event_booking' THEN (SELECT ${eventBookings.bookingReference}
          FROM ${eventBookings} WHERE ${eventBookings.id} = ${payments.payableId})
        WHEN 'park_ticket' THEN (SELECT ${parkTickets.ticketReference}
          FROM ${parkTickets} WHERE ${parkTickets.id} = ${payments.payableId})
      END
    )`;

    return Promise.resolve(
      this.db
        .select({
          id: payments.id,
          userId: payments.userId,
          payableType: payments.payableType,
          payableId: payments.payableId,
          amount: payments.amount,
          status: payments.status,
          method: payments.method,
          paymentReference: payments.paymentReference,
          paidAt: payments.paidAt,
          createdAt: payments.createdAt,
          updatedAt: payments.updatedAt,
          payableReference,
        })
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt))
        .all(),
    );
  }
}
