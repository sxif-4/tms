import { Injectable } from '@nestjs/common';
import { toDateKey } from '../../shared/utils/park-date';
import {
  ParkDaysService,
  type ParkDayView,
} from '../park-days/park-days.service';
import {
  ParkDashboardRepository,
  type ChannelSplit,
  type GateTicketRow,
  type RevenuePoint,
  type ScheduleFillRow,
} from './park-dashboard.repository';

export interface ParkDashboardResponse {
  kpis: {
    ticketsSoldToday: ChannelSplit;
    revenueToday: number;
    revenueLast30Days: number;
    visitorsCheckedInToday: number;
    todaysFill: {
      sold: number;
      capacity: number;
      remaining: number;
      fillRate: number;
      isClosed: boolean;
    };
  };
  capacityAlerts: {
    schedulesNearCapacity: ScheduleFillRow[];
    daysNearCapacity: ParkDayView[];
    closedDays: ParkDayView[];
  };
  todaysGate: {
    expected: number;
    checkedIn: number;
    notArrived: number;
    items: GateTicketRow[];
  };
  salesTrend: RevenuePoint[];
  upcomingSchedules: ScheduleFillRow[];
}

const DAY_SECONDS = 86_400;
/** A day this full is worth warning about before it sells out. */
const NEAR_CAPACITY = 0.9;
/** How far ahead the "closed soon" warning looks. */
const LOOKAHEAD_DAYS = 14;

@Injectable()
export class ParkDashboardService {
  constructor(
    private readonly dashboardRepo: ParkDashboardRepository,
    private readonly parkDays: ParkDaysService,
  ) {}

  async getDashboard(): Promise<ParkDashboardResponse> {
    const nowSec = Math.floor(Date.now() / 1000);
    const startOfToday = Math.floor(new Date().setUTCHours(0, 0, 0, 0) / 1000);

    const today = new Date();
    const lookahead = new Date();
    lookahead.setUTCDate(lookahead.getUTCDate() + LOOKAHEAD_DAYS);

    const [
      ticketsSoldToday,
      revenueToday,
      revenueLast30Days,
      visitorsCheckedInToday,
      todaysGate,
      salesTrend,
      schedulesNearCapacity,
      upcomingSchedules,
      todaysDay,
      upcomingDays,
    ] = await Promise.all([
      this.dashboardRepo.ticketsSoldToday(),
      this.dashboardRepo.revenueBetween(startOfToday, nowSec),
      this.dashboardRepo.revenueBetween(nowSec - 30 * DAY_SECONDS, nowSec),
      this.dashboardRepo.checkedInToday(),
      this.dashboardRepo.todaysGate(),
      this.dashboardRepo.revenueTrend(),
      this.dashboardRepo.schedulesNearCapacity(NEAR_CAPACITY),
      this.dashboardRepo.upcomingSchedules(),
      // ParkDaysService owns "default vs override vs closed" — read it, don't redo it.
      this.parkDays.availabilityFor(today),
      this.parkDays.listRange(toDateKey(today), toDateKey(lookahead)),
    ]);

    return {
      kpis: {
        ticketsSoldToday,
        revenueToday: round2(revenueToday),
        revenueLast30Days: round2(revenueLast30Days),
        visitorsCheckedInToday,
        todaysFill: {
          sold: todaysDay.sold,
          capacity: todaysDay.capacity,
          remaining: todaysDay.remaining,
          fillRate: rate(todaysDay.sold, todaysDay.capacity),
          isClosed: todaysDay.isClosed,
        },
      },
      capacityAlerts: {
        schedulesNearCapacity,
        daysNearCapacity: upcomingDays.filter(
          (day) =>
            !day.isClosed &&
            day.capacity > 0 &&
            day.sold / day.capacity >= NEAR_CAPACITY,
        ),
        closedDays: upcomingDays.filter((day) => day.isClosed),
      },
      todaysGate,
      salesTrend,
      upcomingSchedules,
    };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Percentage with one decimal, matching the hotel dashboard's occupancyRate. */
function rate(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}
