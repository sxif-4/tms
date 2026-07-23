import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PublicHotelsRepository,
  type DayAvailabilityRow,
  type PublicAmenity,
  type PublicHotelDetail,
  type PublicHotelSummary,
} from './public-hotels.repository';

export interface RoomTypeAvailability {
  roomTypeId: number;
  name: string;
  description: string;
  basePricePerNight: string;
  maxOccupancy: number;
  totalRooms: number;
  availableRooms: number;
  nights: number;
  totalPrice: number;
  image: string | null;
  images: string[];
  amenities: PublicAmenity[];
}

export interface DayAvailability {
  date: string;
  totalRooms: number;
  availableRooms: number;
  /** Rough "health bar" bucket for the visitor-facing calendar. */
  level: 'none' | 'low' | 'medium' | 'high';
}

const DAY_MS = 86_400_000;

function levelFor(
  availableRooms: number,
  totalRooms: number,
): DayAvailability['level'] {
  if (totalRooms === 0 || availableRooms <= 0) return 'none';
  const ratio = availableRooms / totalRooms;
  if (ratio < 0.25) return 'low';
  if (ratio < 0.6) return 'medium';
  return 'high';
}

@Injectable()
export class PublicHotelsService {
  constructor(private readonly hotelsRepo: PublicHotelsRepository) {}

  browse(filters: {
    minPrice?: number;
    maxPrice?: number;
    guests?: number;
  }): Promise<PublicHotelSummary[]> {
    return this.hotelsRepo.listSummaries(filters);
  }

  async detail(hotelId: number): Promise<PublicHotelDetail> {
    const hotel = await this.hotelsRepo.detail(hotelId);
    if (!hotel) throw new NotFoundException(`Hotel #${hotelId} not found`);
    return hotel;
  }

  async availability(
    hotelId: number,
    checkIn: string,
    checkOut: string,
  ): Promise<RoomTypeAvailability[]> {
    await this.detail(hotelId); // 404 if missing
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkInDate >= checkOutDate) {
      throw new BadRequestException('checkIn must be before checkOut');
    }
    const nights = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / DAY_MS,
    );

    const rows = await this.hotelsRepo.availability(
      hotelId,
      Math.floor(checkInDate.getTime() / 1000),
      Math.floor(checkOutDate.getTime() / 1000),
    );
    return rows.map((r) => ({
      roomTypeId: r.roomTypeId,
      name: r.name,
      description: r.description,
      basePricePerNight: r.basePricePerNight,
      maxOccupancy: r.maxOccupancy,
      totalRooms: r.totalRooms,
      availableRooms: Math.max(r.totalRooms - r.overlapping, 0),
      nights,
      totalPrice: Math.round(Number(r.basePricePerNight) * nights * 100) / 100,
      image: r.image,
      images: r.images,
      amenities: r.amenities,
    }));
  }

  async availabilityCalendar(
    hotelId: number,
    roomTypeId: number | undefined,
    from: string,
    to: string,
  ): Promise<DayAvailability[]> {
    await this.detail(hotelId); // 404 if missing
    const fromSec = Math.floor(new Date(from).getTime() / 1000);
    const toSec = Math.floor(new Date(to).getTime() / 1000);
    const rows: DayAvailabilityRow[] =
      await this.hotelsRepo.availabilityCalendar(
        hotelId,
        roomTypeId,
        fromSec,
        toSec,
      );
    return rows.map((r) => {
      const availableRooms = Math.max(r.totalRooms - r.booked, 0);
      return {
        date: r.day,
        totalRooms: r.totalRooms,
        availableRooms,
        level: levelFor(availableRooms, r.totalRooms),
      };
    });
  }
}
