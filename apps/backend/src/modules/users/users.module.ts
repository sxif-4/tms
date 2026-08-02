import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelsModule } from '../hotels/hotels.module';
import { UserAssignmentsRepository } from './user-assignments.repository';
import { UserAssignmentsService } from './user-assignments.service';
import { UserHotelsController } from './user-hotels.controller';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  // HotelsModule exports HotelsRepository, used to validate assignment targets.
  imports: [AuditModule, HotelsModule],
  controllers: [UsersController, UserHotelsController],
  providers: [
    UsersService,
    UsersRepository,
    UserAssignmentsService,
    UserAssignmentsRepository,
  ],
  exports: [UsersService],
})
export class UsersModule {}
