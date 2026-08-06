import { Module } from '@nestjs/common';
import { EventBookingsModule } from '../event-bookings/event-bookings.module';
import { FerryModule } from '../ferry/ferry.module';
import { HotelBookingsModule } from '../hotel-bookings/hotel-bookings.module';
import { ParkTicketsModule } from '../park-tickets/park-tickets.module';
import { UsersModule } from '../users/users.module';
import { CustomersController } from './customers.controller';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';

/**
 * Aggregates the four booking domains into one admin-facing customer view.
 * Imports each domain's module for its exported repository rather than
 * re-querying their tables here.
 */
@Module({
  imports: [
    UsersModule,
    HotelBookingsModule,
    FerryModule,
    EventBookingsModule,
    ParkTicketsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository],
})
export class CustomersModule {}
