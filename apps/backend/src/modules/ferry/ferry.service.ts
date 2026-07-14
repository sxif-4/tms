import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  type FerryBooking,
  type FerryRoute,
  type FerrySchedule,
} from '../../shared/database/schema';
import { CreateFerryBookingDto } from './dto/create-ferry-booking.dto';
import { CreateFerryRouteDto } from './dto/create-ferry-route.dto';
import { CreateFerryScheduleDto } from './dto/create-ferry-schedule.dto';
import { UpdateFerryRouteDto } from './dto/update-ferry-route.dto';
import { UpdateFerryScheduleDto } from './dto/update-ferry-schedule.dto';
import {
  FerryRepository,
  type HotelBookingOptionRow,
} from './ferry.repository';

const money = (value: number | string) => Number(value).toFixed(2);
const ref = () => `FB-${randomUUID().slice(0, 8).toUpperCase()}`;

@Injectable()
export class FerryService {
  constructor(private readonly ferryRepo: FerryRepository) {}

  listRoutes(): Promise<FerryRoute[]> {
    return this.ferryRepo.findAllRoutes();
  }

  async getRouteById(id: number): Promise<FerryRoute> {
    const route = await this.ferryRepo.findRouteById(id);
    if (!route) throw new NotFoundException(`Ferry route #${id} not found`);
    return route;
  }

  async createRoute(dto: CreateFerryRouteDto): Promise<FerryRoute> {
    return this.ferryRepo.createRoute({
      name: dto.name,
      origin: dto.origin,
      destination: dto.destination,
    });
  }

  async updateRoute(id: number, dto: UpdateFerryRouteDto): Promise<FerryRoute> {
    await this.getRouteById(id);

    const updated = await this.ferryRepo.updateRoute(id, {
      name: dto.name,
      origin: dto.origin,
      destination: dto.destination,
    });
    if (!updated) throw new NotFoundException(`Ferry route #${id} not found`);
    return updated;
  }

  async removeRoute(id: number): Promise<void> {
    await this.getRouteById(id);
    await this.ferryRepo.deleteRoute(id);
  }

  listSchedules(): Promise<FerrySchedule[]> {
    return this.ferryRepo.findAllSchedules();
  }

  async getScheduleById(id: number): Promise<FerrySchedule> {
    const schedule = await this.ferryRepo.findScheduleById(id);
    if (!schedule)
      throw new NotFoundException(`Ferry schedule #${id} not found`);
    return schedule;
  }

  async createSchedule(dto: CreateFerryScheduleDto): Promise<FerrySchedule> {
    await this.getRouteById(dto.routeId);

    return this.ferryRepo.createSchedule({
      routeId: dto.routeId,
      departureAt: new Date(dto.departureAt),
      direction: dto.direction,
      capacity: dto.capacity,
      basePrice: money(dto.basePrice),
      status: dto.status,
    });
  }

  async updateSchedule(
    id: number,
    dto: UpdateFerryScheduleDto,
  ): Promise<FerrySchedule> {
    await this.getScheduleById(id);

    if (dto.routeId != null) {
      await this.getRouteById(dto.routeId);
    }

    const updated = await this.ferryRepo.updateSchedule(id, {
      routeId: dto.routeId,
      departureAt: dto.departureAt ? new Date(dto.departureAt) : undefined,
      direction: dto.direction,
      capacity: dto.capacity,
      basePrice: dto.basePrice != null ? money(dto.basePrice) : undefined,
      status: dto.status,
    });
    if (!updated)
      throw new NotFoundException(`Ferry schedule #${id} not found`);
    return updated;
  }

  async removeSchedule(id: number): Promise<void> {
    await this.getScheduleById(id);
    await this.ferryRepo.deleteSchedule(id);
  }

  /** Hotel bookings a staff member can pick from when creating a ferry booking for this user — cancelled ones are excluded since they can never satisfy the valid-stay rule. */
  async listHotelBookingsForUser(
    userId: number,
  ): Promise<HotelBookingOptionRow[]> {
    const bookings = await this.ferryRepo.findHotelBookingsByUserId(userId);
    return bookings.filter((booking) => booking.status !== 'cancelled');
  }

  listBookings(): Promise<FerryBooking[]> {
    return this.ferryRepo.findAllBookings();
  }

  async getBookingById(id: number): Promise<FerryBooking> {
    const booking = await this.ferryRepo.findBookingById(id);
    if (!booking) throw new NotFoundException(`Ferry booking #${id} not found`);
    return booking;
  }

  async createBooking(dto: CreateFerryBookingDto): Promise<FerryBooking> {
    const schedule = await this.getScheduleById(dto.scheduleId);
    const hotelBooking = await this.ferryRepo.findHotelBookingById(
      dto.hotelBookingId,
    );

    if (!hotelBooking) {
      throw new NotFoundException(
        `Hotel booking #${dto.hotelBookingId} not found`,
      );
    }

    if (hotelBooking.status === 'cancelled') {
      throw new BadRequestException(
        'Hotel booking is cancelled and cannot be used for ferry access',
      );
    }

    if (dto.passengerCount > schedule.capacity) {
      throw new BadRequestException(
        `Passenger count exceeds schedule capacity of ${schedule.capacity}`,
      );
    }

    const existingBookings = await this.ferryRepo.findBookingsByScheduleId(
      dto.scheduleId,
    );
    const bookedPassengers = existingBookings.reduce(
      (sum, booking) => sum + Number(booking.passengerCount),
      0,
    );

    if (bookedPassengers + dto.passengerCount > schedule.capacity) {
      throw new BadRequestException(
        'Not enough capacity remaining on this ferry schedule',
      );
    }

    const totalAmount = money(Number(schedule.basePrice) * dto.passengerCount);

    return this.ferryRepo.createBooking({
      bookingReference: ref(),
      userId: dto.userId,
      scheduleId: dto.scheduleId,
      hotelBookingId: dto.hotelBookingId,
      passengerCount: dto.passengerCount,
      totalAmount,
      validatedBy: dto.validatedBy,
      validatedAt: dto.validatedAt ? new Date(dto.validatedAt) : null,
      status: dto.status,
    });
  }

  async updateBooking(
    id: number,
    dto: Partial<CreateFerryBookingDto>,
  ): Promise<FerryBooking> {
    const current = await this.getBookingById(id);

    const scheduleId = dto.scheduleId ?? current.scheduleId;
    const schedule = await this.getScheduleById(scheduleId);

    const hotelBookingId = dto.hotelBookingId ?? current.hotelBookingId;
    const hotelBooking =
      await this.ferryRepo.findHotelBookingById(hotelBookingId);

    if (!hotelBooking) {
      throw new NotFoundException(`Hotel booking #${hotelBookingId} not found`);
    }

    if (hotelBooking.status === 'cancelled') {
      throw new BadRequestException(
        'Hotel booking is cancelled and cannot be used for ferry access',
      );
    }

    const passengerCount = dto.passengerCount ?? current.passengerCount;
    if (passengerCount > schedule.capacity) {
      throw new BadRequestException(
        `Passenger count exceeds schedule capacity of ${schedule.capacity}`,
      );
    }

    const existingBookings =
      await this.ferryRepo.findBookingsByScheduleId(scheduleId);
    const currentBookingId = current.id;
    const bookedPassengers = existingBookings.reduce((sum, booking) => {
      if (booking.id === currentBookingId) return sum;
      return sum + Number(booking.passengerCount);
    }, 0);

    if (bookedPassengers + passengerCount > schedule.capacity) {
      throw new BadRequestException(
        'Not enough capacity remaining on this ferry schedule',
      );
    }

    const totalAmount = money(Number(schedule.basePrice) * passengerCount);

    const updated = await this.ferryRepo.updateBooking(id, {
      userId: dto.userId,
      scheduleId: dto.scheduleId,
      hotelBookingId: dto.hotelBookingId,
      passengerCount: dto.passengerCount,
      totalAmount,
      validatedBy: dto.validatedBy,
      validatedAt: dto.validatedAt ? new Date(dto.validatedAt) : undefined,
      status: dto.status,
    });
    if (!updated) throw new NotFoundException(`Ferry booking #${id} not found`);
    return updated;
  }

  async removeBooking(id: number): Promise<void> {
    await this.getBookingById(id);
    await this.ferryRepo.deleteBooking(id);
  }
}
