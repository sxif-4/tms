import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import type {
  DayAvailability,
  RoomTypeAvailability,
} from './public-hotels.service';
import { PublicHotelsService } from './public-hotels.service';
import type {
  PublicHotelDetail,
  PublicHotelSummary,
} from './public-hotels.repository';

/** Unauthenticated hotel browsing for visitors — no roles, no staff scoping. */
@Controller('public/hotels')
@Public()
@Roles()
export class PublicHotelsController {
  constructor(private readonly hotelsService: PublicHotelsService) {}

  @Get()
  browse(
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('guests') guests?: string,
  ): Promise<PublicHotelSummary[]> {
    return this.hotelsService.browse({
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      guests: guests ? Number(guests) : undefined,
    });
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number): Promise<PublicHotelDetail> {
    return this.hotelsService.detail(id);
  }

  @Get(':id/availability')
  availability(
    @Param('id', ParseIntPipe) id: number,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
  ): Promise<RoomTypeAvailability[]> {
    if (!checkIn || !checkOut) {
      throw new BadRequestException('checkIn and checkOut are required');
    }
    return this.hotelsService.availability(id, checkIn, checkOut);
  }

  @Get(':id/availability-calendar')
  availabilityCalendar(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('roomTypeId') roomTypeId?: string,
  ): Promise<DayAvailability[]> {
    const now = new Date();
    const defaultFrom = from ?? now.toISOString();
    const defaultTo =
      to ?? new Date(now.getTime() + 60 * 86_400_000).toISOString();
    return this.hotelsService.availabilityCalendar(
      id,
      roomTypeId ? Number(roomTypeId) : undefined,
      defaultFrom,
      defaultTo,
    );
  }
}
