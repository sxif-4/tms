import { BadRequestException, ConflictException } from '@nestjs/common';
import { Role } from '../../shared/enums/role.enum';
import { FerryService } from './ferry.service';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
/** `days` from now — every fixture derives from one clock so date keys line up. */
const at = (days: number) => new Date(now + days * DAY);

const staff = { id: 99, email: 'ferry@example.com', role: Role.FerryStaff };

const schedule = (overrides = {}) => ({
  id: 1,
  routeId: 1,
  departureAt: at(3),
  direction: 'to_theme_park' as const,
  capacity: 10,
  basePrice: '40.00',
  status: 'scheduled' as const,
  createdAt: at(-30),
  updatedAt: at(-30),
  ...overrides,
});

/** A stay that comfortably contains the default sailing at +3. */
const stay = (overrides = {}) => ({
  id: 7,
  userId: 42,
  checkIn: at(2),
  checkOut: at(5),
  status: 'confirmed' as const,
  ...overrides,
});

const dto = (overrides = {}) => ({
  userId: 42,
  scheduleId: 1,
  hotelBookingId: 7,
  passengerCount: 2,
  ...overrides,
});

describe('FerryService', () => {
  let service: FerryService;
  let repo: Record<string, jest.Mock>;
  let audit: { record: jest.Mock };

  beforeEach(() => {
    repo = {
      findRouteById: jest.fn(),
      deleteRoute: jest.fn(),
      countSchedulesByRouteId: jest.fn().mockResolvedValue(0),
      findScheduleById: jest.fn().mockResolvedValue(schedule()),
      updateSchedule: jest.fn(),
      deleteSchedule: jest.fn(),
      countBookingsByScheduleId: jest.fn().mockResolvedValue(0),
      findHotelBookingById: jest.fn().mockResolvedValue(stay()),
      findHotelBookingsByUserId: jest.fn(),
      sumPassengersByScheduleId: jest.fn().mockResolvedValue(0),
      findBookingById: jest.fn(),
      createBooking: jest.fn((data: Record<string, unknown>) =>
        Promise.resolve({ id: 5, ...data }),
      ),
      updateBooking: jest.fn((id: number, data: Record<string, unknown>) =>
        Promise.resolve({ id, ...data }),
      ),
      deleteBooking: jest.fn(),
    };
    audit = { record: jest.fn() };
    service = new FerryService(repo as never, audit as never);
  });

  describe('the valid-hotel-booking rule', () => {
    it('rejects a stay belonging to a different guest', async () => {
      repo.findHotelBookingById.mockResolvedValue(stay({ userId: 43 }));

      await expect(service.createBooking(staff, dto())).rejects.toThrow(
        /belongs to a different guest/,
      );
    });

    it('rejects an unpaid (pending) stay', async () => {
      repo.findHotelBookingById.mockResolvedValue(stay({ status: 'pending' }));

      await expect(service.createBooking(staff, dto())).rejects.toThrow(
        /a confirmed stay is required/,
      );
    });

    it('rejects a cancelled stay', async () => {
      repo.findHotelBookingById.mockResolvedValue(
        stay({ status: 'cancelled' }),
      );

      await expect(service.createBooking(staff, dto())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('accepts a completed stay', async () => {
      repo.findScheduleById.mockResolvedValue(schedule({ departureAt: at(3) }));
      repo.findHotelBookingById.mockResolvedValue(
        stay({ status: 'completed', checkIn: at(1), checkOut: at(4) }),
      );

      await expect(service.createBooking(staff, dto())).resolves.toBeDefined();
    });

    it('accepts a sailing one day past check-out (the travel grace)', async () => {
      repo.findScheduleById.mockResolvedValue(schedule({ departureAt: at(4) }));
      repo.findHotelBookingById.mockResolvedValue(
        stay({ checkIn: at(1), checkOut: at(3) }),
      );

      await expect(service.createBooking(staff, dto())).resolves.toBeDefined();
    });

    it('rejects a sailing beyond the grace window', async () => {
      repo.findScheduleById.mockResolvedValue(schedule({ departureAt: at(5) }));
      repo.findHotelBookingById.mockResolvedValue(
        stay({ checkIn: at(1), checkOut: at(3) }),
      );

      await expect(service.createBooking(staff, dto())).rejects.toThrow(
        /falls outside the stay/,
      );
    });

    it('re-checks eligibility when a booking moves to another sailing', async () => {
      repo.findBookingById.mockResolvedValue({
        id: 5,
        userId: 42,
        scheduleId: 1,
        hotelBookingId: 7,
        passengerCount: 2,
      });
      // The new sailing is long after the stay that authorises it.
      repo.findScheduleById.mockResolvedValue(
        schedule({ departureAt: at(30) }),
      );

      await expect(
        service.updateBooking(staff, 5, { scheduleId: 2 }),
      ).rejects.toThrow(/falls outside the stay/);
    });
  });

  describe('sailing bookability', () => {
    it.each(['departed', 'cancelled'] as const)(
      'rejects a %s sailing',
      async (status) => {
        repo.findScheduleById.mockResolvedValue(schedule({ status }));

        await expect(service.createBooking(staff, dto())).rejects.toThrow(
          `This sailing is ${status}`,
        );
      },
    );

    it('rejects a sailing whose departure has passed', async () => {
      repo.findScheduleById.mockResolvedValue(
        schedule({ departureAt: at(-1), status: 'scheduled' }),
      );

      await expect(service.createBooking(staff, dto())).rejects.toThrow(
        /already departed/,
      );
    });
  });

  describe('capacity', () => {
    it('rejects a booking that would oversell the sailing', async () => {
      repo.sumPassengersByScheduleId.mockResolvedValue(9); // capacity 10

      await expect(
        service.createBooking(staff, dto({ passengerCount: 2 })),
      ).rejects.toThrow('Only 1 seat(s) left on this sailing');
    });

    it('accepts a booking that exactly fills the sailing', async () => {
      repo.sumPassengersByScheduleId.mockResolvedValue(8);

      await expect(
        service.createBooking(staff, dto({ passengerCount: 2 })),
      ).resolves.toBeDefined();
    });

    it('measures the sailing without the booking being edited', async () => {
      repo.findBookingById.mockResolvedValue({
        id: 5,
        userId: 42,
        scheduleId: 1,
        hotelBookingId: 7,
        passengerCount: 2,
      });

      await service.updateBooking(staff, 5, { passengerCount: 3 });

      // Otherwise the booking's own seats would be counted against it.
      expect(repo.sumPassengersByScheduleId).toHaveBeenCalledWith(1, 5);
    });

    it('will not shrink a sailing below what is already booked', async () => {
      repo.findScheduleById.mockResolvedValue(schedule({ capacity: 10 }));
      repo.sumPassengersByScheduleId.mockResolvedValue(6);

      await expect(
        service.updateSchedule(staff, 1, { capacity: 4 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('server-controlled fields', () => {
    it('always creates a booking as pending', async () => {
      await service.createBooking(staff, dto());

      expect(repo.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });

    it('never accepts client-supplied validation fields', async () => {
      await service.createBooking(staff, dto());

      const [data] = repo.createBooking.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(data.validatedBy).toBeUndefined();
      expect(data.validatedAt).toBeUndefined();
    });

    it('snapshots the price from the sailing, not the client', async () => {
      await service.createBooking(staff, dto({ passengerCount: 3 }));

      expect(repo.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: '120.00' }),
      );
    });

    it('generates its own booking reference', async () => {
      await service.createBooking(staff, dto());

      const [data] = repo.createBooking.mock.calls[0] as [
        { bookingReference: string },
      ];
      expect(data.bookingReference).toMatch(/^FB-[0-9A-F]{8}$/);
    });
  });

  describe('hotel booking picker', () => {
    it('offers only stays the eligibility rule would accept', async () => {
      repo.findHotelBookingsByUserId.mockResolvedValue([
        { id: 1, status: 'confirmed' },
        { id: 2, status: 'completed' },
        { id: 3, status: 'pending' },
        { id: 4, status: 'cancelled' },
      ]);

      const options = await service.listHotelBookingsForUser(42);

      expect(options.map((option) => option.id)).toEqual([1, 2]);
    });
  });

  describe('delete guards', () => {
    it('refuses to delete a route that still has sailings', async () => {
      repo.findRouteById.mockResolvedValue({ id: 1, name: 'Main Pier' });
      repo.countSchedulesByRouteId.mockResolvedValue(4);

      await expect(service.removeRoute(staff, 1)).rejects.toThrow(
        'Cannot delete a route with 4 sailing(s) — remove them first',
      );
      expect(repo.deleteRoute).not.toHaveBeenCalled();
    });

    it('refuses to delete a sailing that still has bookings', async () => {
      repo.countBookingsByScheduleId.mockResolvedValue(12);

      await expect(service.removeSchedule(staff, 1)).rejects.toThrow(
        /cancel it instead/,
      );
      expect(repo.deleteSchedule).not.toHaveBeenCalled();
    });
  });

  describe('audit trail', () => {
    it('records the acting staff member against the booking', async () => {
      await service.createBooking(staff, dto());

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: staff.id,
          action: 'ferry_booking.created',
          subjectType: 'FerryBooking',
          subjectId: 5,
        }),
      );
    });
  });
});
