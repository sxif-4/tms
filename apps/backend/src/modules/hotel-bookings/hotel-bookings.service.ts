import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../../shared/audit/audit.service';
import { FerryService } from '../ferry/ferry.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { HotelsRepository } from '../hotels/hotels.repository';
import { RoomTypesRepository } from '../room-types/room-types.repository';
import { RoomsRepository } from '../rooms/rooms.repository';
import { UsersService } from '../users/users.service';
import { AssignRoomDto } from './dto/assign-room.dto';
import { CreateHotelBookingDto } from './dto/create-hotel-booking.dto';
import {
  CreateManualBookingDto,
  type BookingSource,
  type PaymentMethod,
} from './dto/create-manual-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import {
  HotelBookingsRepository,
  type GuestSearchRow,
  type HotelBookingRow,
  type RoomTypeAvailabilityRow,
} from './hotel-bookings.repository';

const DAY_MS = 86_400_000;
const ref = () => `HB-${randomUUID().slice(0, 8).toUpperCase()}`;

interface BookRoomInput {
  /** The guest the booking belongs to — never the staff member taking it. */
  guestId: number;
  hotelId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  channel: 'online' | 'staff';
  /** Staff member for a desk booking; null when the visitor booked it. */
  soldByUserId: number | null;
  status: 'pending' | 'confirmed';
  /** Pre-assigned room, when the desk already knows which one. */
  roomId?: number;
  /** Only read when `status` is `confirmed`. */
  paymentMethod?: PaymentMethod;
  source?: BookingSource;
  arrivalTime?: string;
  specialRequests?: string;
  internalNotes?: string;
}

@Injectable()
export class HotelBookingsService {
  constructor(
    private readonly bookingsRepo: HotelBookingsRepository,
    private readonly hotelsRepo: HotelsRepository,
    private readonly roomTypesRepo: RoomTypesRepository,
    private readonly roomsRepo: RoomsRepository,
    private readonly hotelAccess: HotelAccessService,
    private readonly users: UsersService,
    private readonly audit: AuditService,
    private readonly ferry: FerryService,
  ) {}

  async listScoped(
    user: AuthenticatedUser,
    filters: { hotelId?: number; status?: string },
  ): Promise<HotelBookingRow[]> {
    const scope = await this.hotelAccess.scopedHotelIds(user);
    if (filters.hotelId) {
      await this.hotelAccess.assertHotelAccess(user, filters.hotelId);
    }
    return this.bookingsRepo.findScoped(scope, filters);
  }

  async getById(user: AuthenticatedUser, id: number): Promise<HotelBookingRow> {
    const row = await this.bookingsRepo.findRowById(id);
    if (!row) throw new NotFoundException(`Booking #${id} not found`);
    await this.hotelAccess.assertHotelAccess(user, row.hotelId);
    return row;
  }

  async getMine(userId: number): Promise<HotelBookingRow[]> {
    return this.bookingsRepo.findByUserId(userId);
  }

  /**
   * What the front desk can actually sell for a given stay. Returns every room
   * type with its remaining inventory and the rooms free for the whole range,
   * so the desk quotes from the same numbers `bookRoom` enforces on submit.
   */
  async availability(
    user: AuthenticatedUser,
    query: { hotelId: number; checkIn: string; checkOut: string },
  ): Promise<RoomTypeAvailabilityRow[]> {
    await this.hotelAccess.assertHotelAccess(user, query.hotelId);

    const checkIn = new Date(query.checkIn);
    const checkOut = new Date(query.checkOut);
    if (checkIn >= checkOut) {
      throw new BadRequestException('checkIn must be before checkOut');
    }

    return this.bookingsRepo.availabilityByRoomType(
      query.hotelId,
      Math.floor(checkIn.getTime() / 1000),
      Math.floor(checkOut.getTime() / 1000),
    );
  }

  /** Visitor-facing creation — the guest books for themselves and pays by card. */
  create(
    user: AuthenticatedUser,
    dto: CreateHotelBookingDto,
  ): Promise<HotelBookingRow> {
    return this.bookRoom({
      guestId: user.id,
      hotelId: dto.hotelId,
      roomTypeId: dto.roomTypeId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      guests: dto.guests,
      channel: 'online',
      soldByUserId: null,
      status: 'confirmed',
    });
  }

  /**
   * Front-desk booking. `hotel_bookings.user_id` is NOT NULL but a walk-in may
   * have no account, so we find-or-create a visitor from the name/email on the
   * form. The booking is never attached to the staff member's own user id —
   * that would corrupt every per-guest report.
   */
  async createManual(
    staff: AuthenticatedUser,
    dto: CreateManualBookingDto,
  ): Promise<HotelBookingRow> {
    // Staff may only book for a hotel they're assigned to; admins pass through.
    await this.hotelAccess.assertHotelAccess(staff, dto.hotelId);
    const guestId = await this.users.findOrCreateVisitor(
      dto.name,
      dto.email,
      dto.phone,
    );

    return this.bookRoom({
      guestId,
      hotelId: dto.hotelId,
      roomTypeId: dto.roomTypeId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      guests: dto.guests,
      channel: 'staff',
      soldByUserId: staff.id,
      status: dto.status ?? 'confirmed',
      roomId: dto.roomId,
      paymentMethod: dto.paymentMethod,
      source: dto.source,
      arrivalTime: dto.arrivalTime,
      specialRequests: dto.specialRequests,
      internalNotes: dto.internalNotes,
    });
  }

  /**
   * Guests the desk can attach a booking to, with how many stays they've had
   * here. A receptionist recognises a returning guest by phone as often as by
   * email, so all three fields match.
   */
  async searchGuests(
    user: AuthenticatedUser,
    query: { hotelId: number; q?: string },
  ): Promise<GuestSearchRow[]> {
    await this.hotelAccess.assertHotelAccess(user, query.hotelId);
    return this.bookingsRepo.searchGuests(query.hotelId, query.q);
  }

  async assignRoom(
    user: AuthenticatedUser,
    bookingId: number,
    dto: AssignRoomDto,
  ): Promise<HotelBookingRow> {
    const booking = await this.bookingsRepo.findRawById(bookingId);
    if (!booking)
      throw new NotFoundException(`Booking #${bookingId} not found`);
    await this.hotelAccess.assertHotelAccess(user, booking.hotelId);

    const room = await this.assertRoomAssignable({
      roomId: dto.roomId,
      hotelId: booking.hotelId,
      roomTypeId: booking.roomTypeId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      excludeBookingId: bookingId,
    });

    await this.bookingsRepo.updateRoomId(bookingId, dto.roomId);
    await this.audit.record({
      userId: user.id,
      action: AuditAction.HotelBookingRoomAssigned,
      subjectType: 'HotelBooking',
      subjectId: bookingId,
      metadata: { roomId: dto.roomId, roomNumber: room.roomNumber },
    });

    const row = await this.bookingsRepo.findRowById(bookingId);
    if (!row) throw new NotFoundException('Booking not found after update');
    return row;
  }

  async updateStatus(
    user: AuthenticatedUser,
    bookingId: number,
    dto: UpdateBookingStatusDto,
  ): Promise<HotelBookingRow> {
    const booking = await this.bookingsRepo.findRawById(bookingId);
    if (!booking)
      throw new NotFoundException(`Booking #${bookingId} not found`);
    await this.hotelAccess.assertHotelAccess(user, booking.hotelId);

    await this.bookingsRepo.updateStatus(bookingId, dto.status);
    await this.audit.record({
      userId: user.id,
      action:
        dto.status === 'cancelled'
          ? AuditAction.HotelBookingCancelled
          : AuditAction.HotelBookingUpdated,
      subjectType: 'HotelBooking',
      subjectId: bookingId,
      metadata: { status: dto.status },
    });

    const row = await this.bookingsRepo.findRowById(bookingId);
    if (!row) throw new NotFoundException('Booking not found after update');
    return row;
  }

  /**
   * Visitor self-cancel: own booking only, pending/confirmed, and at least
   * 48 hours before check-in (matches the public cancellation policy copy).
   */
  async cancelOwn(
    user: AuthenticatedUser,
    bookingId: number,
  ): Promise<HotelBookingRow> {
    const booking = await this.bookingsRepo.findRawById(bookingId);
    if (!booking)
      throw new NotFoundException(`Booking #${bookingId} not found`);
    if (booking.userId !== user.id) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      throw new BadRequestException(
        `Cannot cancel a booking with status "${booking.status}"`,
      );
    }

    const hoursUntilCheckIn =
      (booking.checkIn.getTime() - Date.now()) / (60 * 60 * 1000);
    if (hoursUntilCheckIn < 48) {
      throw new BadRequestException(
        'Free cancellation is only available up to 48 hours before check-in',
      );
    }

    await this.bookingsRepo.updateStatus(bookingId, 'cancelled');
    await this.audit.record({
      userId: user.id,
      action: AuditAction.HotelBookingCancelled,
      subjectType: 'HotelBooking',
      subjectId: bookingId,
      metadata: { status: 'cancelled', by: 'visitor' },
    });
    // The stay was what authorised ferry travel; it goes with it.
    await this.ferry.cancelComplimentaryPasses(user.id, bookingId);

    const row = await this.bookingsRepo.findRowById(bookingId);
    if (!row) throw new NotFoundException('Booking not found after cancel');
    return row;
  }

  /**
   * The one place a hotel booking is ever created. The online and desk channels
   * share it so the availability and pricing rules can't drift apart between
   * the two.
   */
  private async bookRoom(input: BookRoomInput): Promise<HotelBookingRow> {
    const hotel = await this.hotelsRepo.findById(input.hotelId);
    if (!hotel)
      throw new NotFoundException(`Hotel #${input.hotelId} not found`);
    // Suspended hotels keep their existing bookings but take no new ones —
    // that holds at the desk too, not just online.
    if (!hotel.isActive) {
      throw new BadRequestException(
        `${hotel.name} is not accepting bookings at the moment`,
      );
    }
    const roomType = await this.roomTypesRepo.findById(input.roomTypeId);
    if (!roomType)
      throw new NotFoundException(`Room type #${input.roomTypeId} not found`);
    // Room types are per-hotel — reject one borrowed from another property.
    if (roomType.hotelId !== input.hotelId) {
      throw new BadRequestException(
        `${roomType.name} is not a room type at ${hotel.name}`,
      );
    }

    const checkIn = new Date(input.checkIn);
    const checkOut = new Date(input.checkOut);
    if (checkIn >= checkOut) {
      throw new BadRequestException('checkIn must be before checkOut');
    }
    if (checkIn.getTime() < Date.now() - DAY_MS) {
      throw new BadRequestException('checkIn cannot be in the past');
    }
    const nights = Math.round(
      (checkOut.getTime() - checkIn.getTime()) / DAY_MS,
    );
    if (input.guests > roomType.maxOccupancy) {
      throw new BadRequestException(
        `${roomType.name} sleeps up to ${roomType.maxOccupancy} guests`,
      );
    }

    const [totalRooms, overlapping] = await Promise.all([
      this.bookingsRepo.countRoomsOfType(input.hotelId, input.roomTypeId),
      this.bookingsRepo.countOverlapping(
        input.hotelId,
        input.roomTypeId,
        Math.floor(checkIn.getTime() / 1000),
        Math.floor(checkOut.getTime() / 1000),
      ),
    ]);
    if (totalRooms === 0 || overlapping >= totalRooms) {
      throw new ConflictException(
        `No ${roomType.name} rooms available for the selected dates`,
      );
    }

    // Validated before the insert so a bad room number can't leave a booking
    // half-created.
    const room = input.roomId
      ? await this.assertRoomAssignable({
          roomId: input.roomId,
          hotelId: input.hotelId,
          roomTypeId: input.roomTypeId,
          checkIn,
          checkOut,
        })
      : null;

    // Price snapshot: what the guest was actually charged. Repricing the room
    // type later must never rewrite this.
    const totalAmount = (Number(roomType.basePricePerNight) * nights).toFixed(
      2,
    );

    const booking = await this.bookingsRepo.create({
      bookingReference: ref(),
      userId: input.guestId,
      hotelId: input.hotelId,
      roomTypeId: input.roomTypeId,
      roomId: room?.id ?? null,
      checkIn,
      checkOut,
      guests: input.guests,
      totalAmount,
      channel: input.channel,
      soldByUserId: input.soldByUserId,
      status: input.status,
      source: input.source ?? null,
      arrivalTime: input.arrivalTime ?? null,
      specialRequests: input.specialRequests || null,
      internalNotes: input.internalNotes || null,
    });

    // Mock payment — always succeeds; no real payment processor is integrated.
    // A `pending` desk booking is money not collected yet, so it gets no
    // payment row until staff confirm it.
    if (input.status === 'confirmed') {
      await this.bookingsRepo.recordMockPayment({
        userId: input.guestId,
        payableId: booking.id,
        amount: totalAmount,
        method:
          input.channel === 'staff' ? (input.paymentMethod ?? 'cash') : 'card',
      });
    }

    await this.audit.record({
      // Attribute the booking to whoever made it: the staff member at the desk,
      // or the visitor themselves online.
      userId: input.soldByUserId ?? input.guestId,
      action: AuditAction.HotelBookingCreated,
      subjectType: 'HotelBooking',
      subjectId: booking.id,
      metadata: {
        hotelId: input.hotelId,
        roomTypeId: input.roomTypeId,
        channel: input.channel,
        totalAmount,
        ...(room ? { roomId: room.id, roomNumber: room.roomNumber } : {}),
      },
    });

    // Ferry travel is included with a confirmed stay: a return pair of
    // complimentary passes, out on check-in day and back on check-out day. The
    // ferry service swallows its own failures — a missing sailing must never
    // fail a paid hotel booking.
    if (input.status === 'confirmed') {
      await this.ferry.issueComplimentaryPasses({
        id: booking.id,
        userId: input.guestId,
        checkIn,
        checkOut,
        guests: input.guests,
      });
    }

    const row = await this.bookingsRepo.findRowById(booking.id);
    if (!row) throw new NotFoundException('Booking not found after creation');
    return row;
  }

  /**
   * Shared room-assignment guard: the room must exist, belong to this hotel,
   * match the booked room type, and be free for the whole stay. Returns the
   * room so callers can name it in their audit metadata.
   */
  private async assertRoomAssignable(input: {
    roomId: number;
    hotelId: number;
    roomTypeId: number;
    checkIn: Date;
    checkOut: Date;
    excludeBookingId?: number;
  }) {
    const room = await this.roomsRepo.findById(input.roomId);
    if (!room) throw new NotFoundException(`Room #${input.roomId} not found`);
    if (room.hotelId !== input.hotelId) {
      throw new BadRequestException('Room does not belong to this hotel');
    }
    if (room.roomTypeId !== input.roomTypeId) {
      throw new BadRequestException(
        'Room type does not match the booked room type',
      );
    }

    const overlap = await this.bookingsRepo.roomHasOverlap(
      input.roomId,
      Math.floor(input.checkIn.getTime() / 1000),
      Math.floor(input.checkOut.getTime() / 1000),
      input.excludeBookingId,
    );
    if (overlap) {
      throw new ConflictException(
        'This room is already assigned to an overlapping booking',
      );
    }
    return room;
  }
}
