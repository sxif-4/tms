import { Injectable } from '@nestjs/common';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import {
  HotelDashboardRepository,
  type DaySheetRow,
  type MaintenanceRoomRow,
  type PendingBookingRow,
  type RevenuePoint,
  type UnassignedBookingRow,
} from './hotel-dashboard.repository';

export interface HotelDashboardResponse {
  hotelId: number;
  kpis: {
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    revenueLast30Days: number;
    activeBookings: number;
  };
  revenueTrend: RevenuePoint[];
  priorityActions: {
    unassignedUpcoming: { total: number; items: UnassignedBookingRow[] };
    pendingConfirmations: { total: number; items: PendingBookingRow[] };
    roomsInMaintenance: { total: number; items: MaintenanceRoomRow[] };
  };
  todaysArrivals: DaySheetRow[];
  todaysDepartures: DaySheetRow[];
}

@Injectable()
export class HotelDashboardService {
  constructor(
    private readonly dashboardRepo: HotelDashboardRepository,
    private readonly hotelAccess: HotelAccessService,
  ) {}

  async getDashboard(
    user: AuthenticatedUser,
    hotelId: number,
  ): Promise<HotelDashboardResponse> {
    await this.hotelAccess.assertHotelAccess(user, hotelId);

    const [
      roomStats,
      activeBookings,
      revenueLast30Days,
      revenueTrend,
      unassignedUpcoming,
      pendingConfirmations,
      roomsInMaintenance,
      todaysArrivals,
      todaysDepartures,
    ] = await Promise.all([
      this.dashboardRepo.roomStats(hotelId),
      this.dashboardRepo.activeBookingsCount(hotelId),
      this.dashboardRepo.revenueLast30Days(hotelId),
      this.dashboardRepo.revenueTrend(hotelId),
      this.dashboardRepo.unassignedUpcoming(hotelId),
      this.dashboardRepo.pendingConfirmations(hotelId),
      this.dashboardRepo.roomsInMaintenance(hotelId),
      this.dashboardRepo.daySheet(hotelId, 'check_in'),
      this.dashboardRepo.daySheet(hotelId, 'check_out'),
    ]);

    const occupancyRate =
      roomStats.totalRooms > 0
        ? Math.round((roomStats.occupiedRooms / roomStats.totalRooms) * 1000) /
          10
        : 0;

    return {
      hotelId,
      kpis: {
        totalRooms: roomStats.totalRooms,
        occupiedRooms: roomStats.occupiedRooms,
        occupancyRate,
        revenueLast30Days: Math.round(revenueLast30Days * 100) / 100,
        activeBookings,
      },
      revenueTrend,
      priorityActions: {
        unassignedUpcoming,
        pendingConfirmations,
        roomsInMaintenance,
      },
      todaysArrivals,
      todaysDepartures,
    };
  }
}
