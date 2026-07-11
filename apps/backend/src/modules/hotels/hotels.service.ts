import { Injectable, NotFoundException } from '@nestjs/common';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import { type Hotel } from '../../shared/database/schema';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { HotelsRepository } from './hotels.repository';

@Injectable()
export class HotelsService {
  constructor(
    private readonly hotelsRepo: HotelsRepository,
    private readonly hotelAccess: HotelAccessService,
  ) {}

  /** Hotels the user manages — every hotel for admins, assigned-only for staff. */
  async listForUser(user: AuthenticatedUser): Promise<Hotel[]> {
    const scope = await this.hotelAccess.scopedHotelIds(user);
    return scope === 'all'
      ? this.hotelsRepo.findAll()
      : this.hotelsRepo.findByIds(scope);
  }

  async getById(user: AuthenticatedUser, id: number): Promise<Hotel> {
    await this.hotelAccess.assertHotelAccess(user, id);
    const hotel = await this.hotelsRepo.findById(id);
    if (!hotel) throw new NotFoundException(`Hotel #${id} not found`);
    return hotel;
  }
}
