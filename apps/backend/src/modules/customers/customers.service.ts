import { Injectable } from '@nestjs/common';
import { EventBookingsRepository } from '../event-bookings/event-bookings.repository';
import type { EventBookingRow } from '../event-bookings/event-bookings.repository';
import { FerryService } from '../ferry/ferry.service';
import type { FerryBookingRow } from '../ferry/ferry.repository';
import { HotelBookingsRepository } from '../hotel-bookings/hotel-bookings.repository';
import type { HotelBookingRow } from '../hotel-bookings/hotel-bookings.repository';
import { ParkTicketsRepository } from '../park-tickets/park-tickets.repository';
import type { ParkTicketRow } from '../park-tickets/park-tickets.repository';
import { UsersService } from '../users/users.service';
import {
  CustomersRepository,
  type CustomerPaymentRow,
  type CustomerSearchRow,
} from './customers.repository';

const SEARCH_LIMIT = 25;

/** Everything the admin needs about one customer, in a single response. */
export interface CustomerProfile {
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
  };
  hotelBookings: HotelBookingRow[];
  ferryBookings: FerryBookingRow[];
  eventBookings: EventBookingRow[];
  parkTickets: ParkTicketRow[];
  payments: CustomerPaymentRow[];
  totals: {
    /** Sum of completed payments, minus anything refunded. */
    lifetimeValue: string;
    refunded: string;
    liveBookings: number;
  };
}

/**
 * The admin's "resolve issues" surface: find a customer, then see every booking
 * they hold across hotel, ferry, park and events alongside what they paid.
 *
 * Read-only by design. Cancelling and amending stay in the domain modules that
 * own those rules — this one only gathers, so there is no second place where
 * booking policy can drift.
 */
@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepo: CustomersRepository,
    private readonly usersService: UsersService,
    private readonly hotelBookingsRepo: HotelBookingsRepository,
    private readonly ferryService: FerryService,
    private readonly eventBookingsRepo: EventBookingsRepository,
    private readonly parkTicketsRepo: ParkTicketsRepository,
  ) {}

  /**
   * Name/email search, with one extra trick: a query that exactly matches a
   * booking or ticket reference resolves to that booking's owner, so a
   * reference from a customer email can be pasted straight in.
   */
  async search(query?: string): Promise<CustomerSearchRow[]> {
    const byName = await this.customersRepo.search(query, SEARCH_LIMIT);
    if (byName.length > 0 || !query?.trim()) return byName;

    const userId = await this.customersRepo.findUserIdByReference(query);
    if (userId == null) return [];

    // Re-run the search by the owner's email so the row carries booking counts
    // rather than being assembled a second, subtly different way.
    const owner = await this.usersService.findByIdWithRole(userId);
    return this.customersRepo.search(owner.email, 1);
  }

  async findById(userId: number): Promise<CustomerProfile> {
    const user = await this.usersService.findByIdWithRole(userId);

    const [hotel, ferry, events, tickets, payments] = await Promise.all([
      this.hotelBookingsRepo.findByUserId(userId),
      this.ferryService.listMyBookings(userId),
      this.eventBookingsRepo.findByUserId(userId),
      this.parkTicketsRepo.findByUserId(userId),
      this.customersRepo.findPaymentsByUserId(userId),
    ]);

    return {
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      hotelBookings: hotel,
      ferryBookings: ferry,
      eventBookings: events,
      parkTickets: tickets,
      payments,
      totals: {
        lifetimeValue: sumAmounts(payments, 'completed'),
        refunded: sumAmounts(payments, 'refunded'),
        liveBookings:
          hotel.filter((b) => b.status !== 'cancelled').length +
          ferry.filter((b) => b.status !== 'cancelled').length +
          events.filter((b) => b.status !== 'cancelled').length +
          tickets.filter(
            (t) => t.status !== 'cancelled' && t.status !== 'refunded',
          ).length,
      },
    };
  }
}

/**
 * Money is stored as decimal-in-text and must stay exact. Summing in integer
 * pence avoids the float drift a plain `parseFloat` sum would introduce.
 */
function sumAmounts(
  payments: CustomerPaymentRow[],
  status: CustomerPaymentRow['status'],
): string {
  const pence = payments
    .filter((p) => p.status === status)
    .reduce((sum, p) => sum + Math.round(Number(p.amount) * 100), 0);
  return (pence / 100).toFixed(2);
}
