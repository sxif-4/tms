import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { EventBookingsService } from './event-bookings.service';

/** The visitor who owns the ticket. */
const OWNER_ID = 5;
/** The park-staff member taking a desk booking. */
const STAFF_ID = 99;

const staff = { id: STAFF_ID, role: 'park_staff' } as never;
const owner = { id: OWNER_ID, role: 'visitor' } as never;

describe('EventBookingsService', () => {
  let service: EventBookingsService;
  let bookingsRepo: {
    findAll: jest.Mock;
    findRowById: jest.Mock;
    findByUserId: jest.Mock;
    create: jest.Mock;
    recordMockPayment: jest.Mock;
    refundPayment: jest.Mock;
    updateStatus: jest.Mock;
  };
  let schedulesRepo: { findRowById: jest.Mock };
  let eventsRepo: { findById: jest.Mock };
  let ticketsRepo: { findById: jest.Mock; findRowByReference: jest.Mock };
  let audit: { record: jest.Mock };

  /** A schedule running on 12 Aug 2026, 20 of 60 seats taken. */
  const schedule = {
    id: 2,
    eventId: 7,
    startAt: new Date('2026-08-12T18:00:00.000Z'),
    capacity: 60,
    booked: 20,
  };

  /** An active 3-person ticket for the same day, owned by OWNER_ID. */
  const ticket = {
    id: 9,
    ticketReference: 'PT-ABCD1234',
    userId: OWNER_ID,
    status: 'active',
    visitDate: new Date('2026-08-12T00:00:00.000Z'),
    quantity: 3,
  };

  const createdBooking = { id: 42, bookingReference: 'EB-99999999' };

  beforeEach(() => {
    bookingsRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findRowById: jest.fn().mockResolvedValue({
        ...createdBooking,
        userId: OWNER_ID,
        status: 'confirmed',
      }),
      findByUserId: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(createdBooking),
      recordMockPayment: jest.fn().mockResolvedValue(undefined),
      refundPayment: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    schedulesRepo = { findRowById: jest.fn().mockResolvedValue(schedule) };
    eventsRepo = {
      findById: jest.fn().mockResolvedValue({ id: 7, basePrice: '55.00' }),
    };
    ticketsRepo = {
      findById: jest.fn().mockResolvedValue(ticket),
      findRowByReference: jest.fn().mockResolvedValue(ticket),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    service = new EventBookingsService(
      bookingsRepo as never,
      schedulesRepo as never,
      eventsRepo as never,
      ticketsRepo as never,
      audit as never,
    );
  });

  describe('create (visitor)', () => {
    it('rejects a ticket belonging to someone else', async () => {
      ticketsRepo.findById.mockResolvedValue({ ...ticket, userId: 1234 });

      await expect(
        service.create(owner, {
          eventScheduleId: 2,
          parkTicketId: 9,
          quantity: 1,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(bookingsRepo.create).not.toHaveBeenCalled();
    });

    it('books the seats and pays by card', async () => {
      await service.create(owner, {
        eventScheduleId: 2,
        parkTicketId: 9,
        quantity: 2,
      });

      expect(bookingsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: OWNER_ID,
          quantity: 2,
          totalAmount: '110.00',
          status: 'confirmed',
        }),
      );
      expect(bookingsRepo.recordMockPayment).toHaveBeenCalledWith(
        expect.objectContaining({ userId: OWNER_ID, method: 'card' }),
      );
    });
  });

  describe('createForStaff (desk)', () => {
    const dto = {
      ticketReference: 'PT-ABCD1234',
      eventScheduleId: 2,
      quantity: 2,
    };

    it('404s on an unknown ticket reference', async () => {
      ticketsRepo.findRowByReference.mockResolvedValue(undefined);

      await expect(service.createForStaff(staff, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(bookingsRepo.create).not.toHaveBeenCalled();
    });

    it('404s when the schedule does not exist', async () => {
      schedulesRepo.findRowById.mockResolvedValue(undefined);

      await expect(service.createForStaff(staff, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('does NOT require the ticket to belong to the staff member', async () => {
      // The whole point of the desk flow: the ticket is the guest's, and the
      // staff member is merely holding it.
      await expect(service.createForStaff(staff, dto)).resolves.toBeDefined();
      expect(bookingsRepo.create).toHaveBeenCalled();
    });

    it('attributes the booking to the ticket owner, not the staff member', async () => {
      await service.createForStaff(staff, dto);

      expect(bookingsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: OWNER_ID }),
      );
      expect(bookingsRepo.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ userId: STAFF_ID }),
      );
      expect(bookingsRepo.recordMockPayment).toHaveBeenCalledWith(
        expect.objectContaining({ userId: OWNER_ID }),
      );
    });

    it('takes a desk booking in cash', async () => {
      await service.createForStaff(staff, dto);

      expect(bookingsRepo.recordMockPayment).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'cash' }),
      );
    });

    it('audits the acting staff member while the booking stays the guest’s', async () => {
      await service.createForStaff(staff, dto);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: STAFF_ID,
          action: AuditAction.EventBookingCreated,
          subjectType: 'EventBooking',
          metadata: expect.objectContaining({
            channel: 'desk',
            soldByUserId: STAFF_ID,
          }),
        }),
      );
    });

    it('rejects a ticket that is not active', async () => {
      ticketsRepo.findRowByReference.mockResolvedValue({
        ...ticket,
        status: 'cancelled',
      });

      await expect(service.createForStaff(staff, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a ticket for a different day to the schedule', async () => {
      ticketsRepo.findRowByReference.mockResolvedValue({
        ...ticket,
        visitDate: new Date('2026-08-11T00:00:00.000Z'),
      });

      await expect(service.createForStaff(staff, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(bookingsRepo.create).not.toHaveBeenCalled();
    });

    it('rejects more seats than the ticket covers', async () => {
      await expect(
        service.createForStaff(staff, { ...dto, quantity: 4 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects overbooking the schedule', async () => {
      // 2 seats left, but the ticket covers 3 — capacity must still bite.
      schedulesRepo.findRowById.mockResolvedValue({
        ...schedule,
        capacity: 22,
        booked: 20,
      });

      await expect(
        service.createForStaff(staff, { ...dto, quantity: 3 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('snapshots the price from the event, not a later reprice', async () => {
      await service.createForStaff(staff, dto);

      expect(bookingsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: '110.00' }),
      );
    });

    it('trims a pasted ticket reference', async () => {
      await service.createForStaff(staff, {
        ...dto,
        ticketReference: '  PT-ABCD1234 ',
      });

      expect(ticketsRepo.findRowByReference).toHaveBeenCalledWith(
        'PT-ABCD1234',
      );
    });
  });
});
