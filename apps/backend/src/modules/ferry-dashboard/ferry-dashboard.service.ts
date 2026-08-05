import { Injectable } from '@nestjs/common';
import {
  FerryDashboardRepository,
  type RecentRequestRow,
  type SailingFillRow,
} from './ferry-dashboard.repository';

export interface RouteOccupancyView {
  routeId: number;
  routeName: string;
  sailings: number;
  capacity: number;
  booked: number;
  occupancyRate: number;
}

export interface FerryDashboardResponse {
  stats: {
    pendingPasses: number;
    todaysDepartures: number;
    boardedToday: number;
    todaysFill: {
      booked: number;
      capacity: number;
      remaining: number;
      fillRate: number;
    };
  };
  nextSailings: SailingFillRow[];
  routeOccupancy: RouteOccupancyView[];
  recentRequests: RecentRequestRow[];
}

@Injectable()
export class FerryDashboardService {
  constructor(private readonly dashboardRepo: FerryDashboardRepository) {}

  async getDashboard(): Promise<FerryDashboardResponse> {
    const [
      pendingPasses,
      todaysDepartures,
      boardedToday,
      todaysFill,
      nextSailings,
      routeOccupancy,
      recentRequests,
    ] = await Promise.all([
      this.dashboardRepo.pendingPasses(),
      this.dashboardRepo.todaysDepartures(),
      this.dashboardRepo.boardedToday(),
      this.dashboardRepo.todaysFill(),
      this.dashboardRepo.nextSailings(),
      this.dashboardRepo.routeOccupancy(),
      this.dashboardRepo.recentRequests(),
    ]);

    return {
      stats: {
        pendingPasses,
        todaysDepartures,
        boardedToday,
        todaysFill: {
          booked: todaysFill.booked,
          capacity: todaysFill.capacity,
          remaining: Math.max(todaysFill.capacity - todaysFill.booked, 0),
          fillRate: rate(todaysFill.booked, todaysFill.capacity),
        },
      },
      nextSailings,
      routeOccupancy: routeOccupancy.map((route) => ({
        ...route,
        occupancyRate: rate(route.booked, route.capacity),
      })),
      recentRequests,
    };
  }
}

/** Percentage with one decimal, matching the hotel and park dashboards. */
function rate(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}
