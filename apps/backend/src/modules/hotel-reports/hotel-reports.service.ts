import { Injectable } from '@nestjs/common';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import {
  HotelReportsRepository,
  type OccupancyPoint,
  type RevenuePoint,
} from './hotel-reports.repository';

const DAY_SECONDS = 86_400;

@Injectable()
export class HotelReportsService {
  constructor(
    private readonly reportsRepo: HotelReportsRepository,
    private readonly hotelAccess: HotelAccessService,
  ) {}

  private range(from?: string, to?: string): [number, number] {
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = from
      ? Math.floor(new Date(from).getTime() / 1000)
      : nowSec - 30 * DAY_SECONDS;
    const toSec = to
      ? Math.floor(new Date(to).getTime() / 1000)
      : nowSec + 30 * DAY_SECONDS;
    return [fromSec, toSec];
  }

  async revenue(
    user: AuthenticatedUser,
    hotelId: number,
    from?: string,
    to?: string,
  ): Promise<RevenuePoint[]> {
    await this.hotelAccess.assertHotelAccess(user, hotelId);
    const [fromSec, toSec] = this.range(from, to);
    return this.reportsRepo.revenueOverTime(hotelId, fromSec, toSec);
  }

  async occupancy(
    user: AuthenticatedUser,
    hotelId: number,
    from?: string,
    to?: string,
  ): Promise<OccupancyPoint[]> {
    await this.hotelAccess.assertHotelAccess(user, hotelId);
    const [fromSec, toSec] = this.range(from, to);
    return this.reportsRepo.occupancyOverTime(hotelId, fromSec, toSec);
  }
}
