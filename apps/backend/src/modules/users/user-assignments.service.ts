import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { Role } from '../../shared/enums/role.enum';
import { HotelsRepository } from '../hotels/hotels.repository';
import {
  type AssignedHotel,
  UserAssignmentsRepository,
} from './user-assignments.repository';
import { UsersRepository } from './users.repository';

/**
 * Admin-driven staff scoping: the role grants the capability (`hotel_staff`),
 * the assignment restricts it to specific hotels. Only hotels are scoped this
 * way — ferry and park staff are authorised by role alone, so this service
 * deliberately exposes no generic assignable-type surface.
 */
@Injectable()
export class UserAssignmentsService {
  constructor(
    private readonly assignmentsRepo: UserAssignmentsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly hotelsRepo: HotelsRepository,
    private readonly audit: AuditService,
  ) {}

  async listHotels(userId: number): Promise<AssignedHotel[]> {
    await this.getUser(userId); // 404 if missing
    return this.assignmentsRepo.findHotelsForUser(userId);
  }

  /** Batch lookup for the admin user grid — one query, not one per card. */
  hotelsForUsers(userIds: number[]): Promise<Map<number, AssignedHotel[]>> {
    return this.assignmentsRepo.findHotelsForUsers(userIds);
  }

  async assignHotel(
    userId: number,
    hotelId: number,
    actorId: number,
  ): Promise<AssignedHotel> {
    const user = await this.getUser(userId);
    if (user.role !== Role.HotelStaff) {
      throw new BadRequestException(
        'Only hotel staff can be assigned to a hotel — change the role first',
      );
    }

    const hotel = await this.hotelsRepo.findById(hotelId);
    if (!hotel) throw new NotFoundException(`Hotel #${hotelId} not found`);

    if (await this.assignmentsRepo.hotelAssignmentExists(userId, hotelId)) {
      throw new ConflictException(
        `${user.name} is already assigned to ${hotel.name}`,
      );
    }

    const created = await this.assignmentsRepo.assignHotel(userId, hotelId);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.UserHotelAssigned,
      subjectType: 'User',
      subjectId: userId,
      metadata: { hotelId, hotelName: hotel.name },
    });

    return { assignmentId: created.id, hotelId, name: hotel.name };
  }

  async unassignHotel(
    userId: number,
    hotelId: number,
    actorId: number,
  ): Promise<void> {
    const removed = await this.assignmentsRepo.deleteHotelAssignment(
      userId,
      hotelId,
    );
    if (!removed) {
      throw new NotFoundException(
        `User #${userId} is not assigned to hotel #${hotelId}`,
      );
    }

    await this.audit.record({
      userId: actorId,
      action: AuditAction.UserHotelUnassigned,
      subjectType: 'User',
      subjectId: userId,
      metadata: { hotelId },
    });
  }

  private async getUser(userId: number) {
    const user = await this.usersRepo.findByIdWithRole(userId);
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    return user;
  }
}
