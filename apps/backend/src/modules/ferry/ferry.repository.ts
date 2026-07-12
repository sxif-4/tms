import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  ferryBookings,
  ferryRoutes,
  ferrySchedules,
  hotelBookings,
  type FerryBooking,
  type FerryRoute,
  type FerrySchedule,
  type HotelBooking,
  type NewFerryBooking,
  type NewFerryRoute,
  type NewFerrySchedule,
} from '../../shared/database/schema';

/** Sole owner of Drizzle queries for the ferry domain. */
@Injectable()
export class FerryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAllRoutes(): Promise<FerryRoute[]> {
    return Promise.resolve(
      this.db.select().from(ferryRoutes).orderBy(asc(ferryRoutes.name)).all(),
    );
  }

  findRouteById(id: number): Promise<FerryRoute | undefined> {
    return Promise.resolve(
      this.db.select().from(ferryRoutes).where(eq(ferryRoutes.id, id)).get(),
    );
  }

  createRoute(data: NewFerryRoute): Promise<FerryRoute> {
    return Promise.resolve(
      this.db.insert(ferryRoutes).values(data).returning().get(),
    );
  }

  updateRoute(
    id: number,
    data: Partial<NewFerryRoute>,
  ): Promise<FerryRoute | undefined> {
    return Promise.resolve(
      this.db
        .update(ferryRoutes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ferryRoutes.id, id))
        .returning()
        .get(),
    );
  }

  deleteRoute(id: number): Promise<void> {
    this.db.delete(ferryRoutes).where(eq(ferryRoutes.id, id)).run();
    return Promise.resolve();
  }

  findAllSchedules(): Promise<FerrySchedule[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(ferrySchedules)
        .orderBy(asc(ferrySchedules.departureAt))
        .all(),
    );
  }

  findScheduleById(id: number): Promise<FerrySchedule | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(ferrySchedules)
        .where(eq(ferrySchedules.id, id))
        .get(),
    );
  }

  createSchedule(data: NewFerrySchedule): Promise<FerrySchedule> {
    return Promise.resolve(
      this.db.insert(ferrySchedules).values(data).returning().get(),
    );
  }

  updateSchedule(
    id: number,
    data: Partial<NewFerrySchedule>,
  ): Promise<FerrySchedule | undefined> {
    return Promise.resolve(
      this.db
        .update(ferrySchedules)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ferrySchedules.id, id))
        .returning()
        .get(),
    );
  }

  deleteSchedule(id: number): Promise<void> {
    this.db.delete(ferrySchedules).where(eq(ferrySchedules.id, id)).run();
    return Promise.resolve();
  }

  findHotelBookingById(id: number): Promise<HotelBooking | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(hotelBookings)
        .where(eq(hotelBookings.id, id))
        .get(),
    );
  }

  findBookingsByScheduleId(scheduleId: number): Promise<FerryBooking[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(ferryBookings)
        .where(eq(ferryBookings.scheduleId, scheduleId))
        .orderBy(desc(ferryBookings.createdAt))
        .all(),
    );
  }

  findAllBookings(): Promise<FerryBooking[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(ferryBookings)
        .orderBy(desc(ferryBookings.createdAt))
        .all(),
    );
  }

  findBookingById(id: number): Promise<FerryBooking | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(ferryBookings)
        .where(eq(ferryBookings.id, id))
        .get(),
    );
  }

  createBooking(data: NewFerryBooking): Promise<FerryBooking> {
    return Promise.resolve(
      this.db.insert(ferryBookings).values(data).returning().get(),
    );
  }

  updateBooking(
    id: number,
    data: Partial<NewFerryBooking>,
  ): Promise<FerryBooking | undefined> {
    return Promise.resolve(
      this.db
        .update(ferryBookings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ferryBookings.id, id))
        .returning()
        .get(),
    );
  }

  deleteBooking(id: number): Promise<void> {
    this.db.delete(ferryBookings).where(eq(ferryBookings.id, id)).run();
    return Promise.resolve();
  }
}
