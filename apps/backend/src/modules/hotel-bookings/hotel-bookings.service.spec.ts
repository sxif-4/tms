import { AuditAction } from '../../shared/enums/audit-action.enum';
import { HotelBookingsService } from './hotel-bookings.service';

/** The visitor who owns the stay. */
const OWNER_ID = 5;
/** The hotel-staff member working the front desk. */
const STAFF_ID = 99;
/** The admin resolving an issue from the customer lookup. */
const ADMIN_ID = 1;

const staff = { id: STAFF_ID, role: 'hotel_staff' } as never;
const admin = { id: ADMIN_ID, role: 'admin' } as never;

const BOOKING_ID = 42;

describe('HotelBookingsService', () => {
  let service: HotelBookingsService;
  let bookingsRepo: {
    findRawById: jest.Mock;
    findRowById: jest.Mock;
    updateStatus: jest.Mock;
  };
  let hotelAccess: { assertHotelAccess: jest.Mock };
  let audit: { record: jest.Mock };
  let ferry: { cancelComplimentaryPasses: jest.Mock };

  /** A live stay, far enough out that the visitor policy would also allow it. */
  const booking = {
    id: BOOKING_ID,
    userId: OWNER_ID,
    hotelId: 3,
    status: 'confirmed',
    checkIn: new Date('2099-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    bookingsRepo = {
      findRawById: jest.fn().mockResolvedValue(booking),
      findRowById: jest
        .fn()
        .mockResolvedValue({ ...booking, status: 'cancelled' }),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    hotelAccess = { assertHotelAccess: jest.fn().mockResolvedValue(undefined) };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    ferry = {
      cancelComplimentaryPasses: jest.fn().mockResolvedValue(undefined),
    };

    service = new HotelBookingsService(
      bookingsRepo as never,
      {} as never, // hotelsRepo
      {} as never, // roomTypesRepo
      {} as never, // roomsRepo
      hotelAccess as never,
      {} as never, // users
      audit as never,
      ferry as never,
    );
  });

  describe('updateStatus', () => {
    /**
     * The stay is what authorises complimentary ferry travel, so cancelling it
     * from the desk or the admin lookup must stand the passes down — the same
     * rule the visitor self-cancel path has always applied.
     */
    it('stands down complimentary ferry passes when staff cancel a stay', async () => {
      await service.updateStatus(staff, BOOKING_ID, { status: 'cancelled' });

      expect(bookingsRepo.updateStatus).toHaveBeenCalledWith(
        BOOKING_ID,
        'cancelled',
      );
      expect(ferry.cancelComplimentaryPasses).toHaveBeenCalledWith(
        STAFF_ID,
        BOOKING_ID,
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.HotelBookingCancelled,
          subjectId: BOOKING_ID,
        }),
      );
    });

    it('attributes the cascade to the admin who performed it', async () => {
      await service.updateStatus(admin, BOOKING_ID, { status: 'cancelled' });

      expect(ferry.cancelComplimentaryPasses).toHaveBeenCalledWith(
        ADMIN_ID,
        BOOKING_ID,
      );
    });

    it('leaves ferry passes alone for a status change that is not a cancel', async () => {
      await service.updateStatus(staff, BOOKING_ID, { status: 'completed' });

      expect(bookingsRepo.updateStatus).toHaveBeenCalledWith(
        BOOKING_ID,
        'completed',
      );
      expect(ferry.cancelComplimentaryPasses).not.toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.HotelBookingUpdated }),
      );
    });

    /** Re-cancelling shouldn't re-run the cascade over already-dead passes. */
    it('does not re-run the cascade on an already-cancelled stay', async () => {
      bookingsRepo.findRawById.mockResolvedValue({
        ...booking,
        status: 'cancelled',
      });

      await service.updateStatus(staff, BOOKING_ID, { status: 'cancelled' });

      expect(ferry.cancelComplimentaryPasses).not.toHaveBeenCalled();
    });
  });
});
