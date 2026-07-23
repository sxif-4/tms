import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { HotelsRepository } from '../hotels/hotels.repository';
import { RoomTypesRepository } from '../room-types/room-types.repository';
import { RoomsRepository } from '../rooms/rooms.repository';
import { AssignRoomDto } from './dto/assign-room.dto';
import { CreateHotelBookingDto } from './dto/create-hotel-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import {
  HotelBookingsRepository,
  type HotelBookingRow,
} from './hotel-bookings.repository';

const DAY_MS = 86_400_000;
const ref = () => `HB-${randomUUID().slice(0, 8).toUpperCase()}`;

@Injectable()
export class HotelBookingsService {
  constructor(
    private readonly bookingsRepo: HotelBookingsRepository,
    private readonly hotelsRepo: HotelsRepository,
    private readonly roomTypesRepo: RoomTypesRepository,
    private readonly roomsRepo: RoomsRepository,
    private readonly hotelAccess: HotelAccessService,
    private readonly audit: AuditService,
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

  /** Visitor-facing creation: validates availability, snapshots price, mocks payment. */
  async create(
    user: AuthenticatedUser,
    dto: CreateHotelBookingDto,
  ): Promise<HotelBookingRow> {
    const hotel = await this.hotelsRepo.findById(dto.hotelId);
    if (!hotel) throw new NotFoundException(`Hotel #${dto.hotelId} not found`);
    const roomType = await this.roomTypesRepo.findById(dto.roomTypeId);
    if (!roomType)
      throw new NotFoundException(`Room type #${dto.roomTypeId} not found`);

    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    if (checkIn >= checkOut) {
      throw new BadRequestException('checkIn must be before checkOut');
    }
    if (checkIn.getTime() < Date.now() - DAY_MS) {
      throw new BadRequestException('checkIn cannot be in the past');
    }
    const nights = Math.round(
      (checkOut.getTime() - checkIn.getTime()) / DAY_MS,
    );
    if (dto.guests > roomType.maxOccupancy) {
      throw new BadRequestException(
        `${roomType.name} sleeps up to ${roomType.maxOccupancy} guests`,
      );
    }

    const [totalRooms, overlapping] = await Promise.all([
      this.bookingsRepo.countRoomsOfType(dto.hotelId, dto.roomTypeId),
      this.bookingsRepo.countOverlapping(
        dto.hotelId,
        dto.roomTypeId,
        Math.floor(checkIn.getTime() / 1000),
        Math.floor(checkOut.getTime() / 1000),
      ),
    ]);
    if (totalRooms === 0 || overlapping >= totalRooms) {
      throw new ConflictException(
        `No ${roomType.name} rooms available for the selected dates`,
      );
    }

    const totalAmount = (Number(roomType.basePricePerNight) * nights).toFixed(
      2,
    );

    const booking = await this.bookingsRepo.create({
      bookingReference: ref(),
      userId: user.id,
      hotelId: dto.hotelId,
      roomTypeId: dto.roomTypeId,
      roomId: null,
      checkIn,
      checkOut,
      guests: dto.guests,
      totalAmount,
      status: 'confirmed',
    });

    // Mock payment — always succeeds; no real payment processor is integrated.
    await this.bookingsRepo.recordMockPayment({
      userId: user.id,
      payableId: booking.id,
      amount: totalAmount,
    });

    await this.audit.record({
      userId: user.id,
      action: AuditAction.HotelBookingCreated,
      subjectType: 'HotelBooking',
      subjectId: booking.id,
      metadata: { hotelId: dto.hotelId, roomTypeId: dto.roomTypeId },
    });

    const row = await this.bookingsRepo.findRowById(booking.id);
    if (!row) throw new NotFoundException('Booking not found after creation');
    return row;
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

    const room = await this.roomsRepo.findById(dto.roomId);
    if (!room) throw new NotFoundException(`Room #${dto.roomId} not found`);
    if (room.hotelId !== booking.hotelId) {
      throw new BadRequestException('Room does not belong to this hotel');
    }
    if (room.roomTypeId !== booking.roomTypeId) {
      throw new BadRequestException(
        'Room type does not match the booked room type',
      );
    }

    const overlap = await this.bookingsRepo.roomHasOverlap(
      dto.roomId,
      Math.floor(booking.checkIn.getTime() / 1000),
      Math.floor(booking.checkOut.getTime() / 1000),
      bookingId,
    );
    if (overlap) {
      throw new ConflictException(
        'This room is already assigned to an overlapping booking',
      );
    }

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

    const row = await this.bookingsRepo.findRowById(bookingId);
    if (!row) throw new NotFoundException('Booking not found after cancel');
    return row;
  }
}
