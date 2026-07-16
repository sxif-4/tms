import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { validationSchema } from './config/env.validation';
import { jwtConfig } from './config/jwt.config';
import { HealthController } from './health.controller';
import { DatabaseModule } from './shared/database/database.module';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { UsersModule } from './modules/users/users.module';
import { AdvertisementsModule } from './modules/advertisements/advertisements.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { MapLocationsModule } from './modules/map-locations/map-locations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { RoomTypesModule } from './modules/room-types/room-types.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { HotelBookingsModule } from './modules/hotel-bookings/hotel-bookings.module';
import { HotelDashboardModule } from './modules/hotel-dashboard/hotel-dashboard.module';
import { HotelReportsModule } from './modules/hotel-reports/hotel-reports.module';
import { PublicHotelsModule } from './modules/public-hotels/public-hotels.module';
import { ParkTicketTypesModule } from './modules/park-ticket-types/park-ticket-types.module';
import { EventsModule } from './modules/events/events.module';
import { EventSchedulesModule } from './modules/event-schedules/event-schedules.module';
import { ParkDaysModule } from './modules/park-days/park-days.module';
import { ParkTicketsModule } from './modules/park-tickets/park-tickets.module';
import { EventBookingsModule } from './modules/event-bookings/event-bookings.module';
import { ParkDashboardModule } from './modules/park-dashboard/park-dashboard.module';
import { ParkReportsModule } from './modules/park-reports/park-reports.module';
import { PublicParkModule } from './modules/public-park/public-park.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      validationSchema,
      validationOptions: { abortEarly: true },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1_000, limit: 10 },
        { name: 'long', ttl: 60_000, limit: 100 },
      ],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    AdvertisementsModule,
    PromotionsModule,
    MapLocationsModule,
    ReportsModule,
    AuditLogsModule,
    HotelsModule,
    RoomTypesModule,
    RoomsModule,
    HotelBookingsModule,
    HotelDashboardModule,
    HotelReportsModule,
    PublicHotelsModule,
    ParkTicketTypesModule,
    EventsModule,
    EventSchedulesModule,
    ParkDaysModule,
    ParkTicketsModule,
    EventBookingsModule,
    ParkDashboardModule,
    ParkReportsModule,
    PublicParkModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: throttle first, then authenticate, then authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
