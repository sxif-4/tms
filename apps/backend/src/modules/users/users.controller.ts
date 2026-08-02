import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserAssignmentsService } from './user-assignments.service';
import { type UserWithRole } from './users.repository';
import { UsersService } from './users.service';

/** Shape returned once when an admin creates an account. */
interface StaffCreatedResponse {
  user: UserResponseDto;
  temporaryPassword: string;
}

/** Admin-only user management. Minimal surface for now. */
@Controller('users')
@Roles(Role.Admin)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly assignments: UserAssignmentsService,
  ) {}

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.listAll();
    const hotelsByUser = await this.assignments.hotelsForUsers(
      users.map((u) => u.id),
    );
    return users.map(
      (u) => new UserResponseDto(u, hotelsByUser.get(u.id) ?? []),
    );
  }

  /** Name/email search for staff-facing pickers (e.g. the ferry booking form). Must stay above `:id` — Nest matches routes in declaration order per method. */
  @Get('search')
  @Roles(Role.Admin, Role.FerryStaff)
  async search(@Query('q') q?: string): Promise<UserResponseDto[]> {
    const users = await this.usersService.search(q);
    return users.map((u) => new UserResponseDto(u));
  }

  @Post()
  async create(
    @Body() dto: CreateStaffDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<StaffCreatedResponse> {
    const { user, temporaryPassword } = await this.usersService.createStaff(
      dto,
      currentUser.id,
    );
    return { user: new UserResponseDto(user), temporaryPassword };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdWithRole(id);
    return this.withAssignments(user);
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    if (id === currentUser.id) {
      throw new ForbiddenException('You cannot change your own role');
    }
    // Re-read assignments: a role change drops the ones the new role can't use.
    return this.withAssignments(
      await this.usersService.updateRole(id, dto.role, currentUser.id),
    );
  }

  @Patch(':id/activate')
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.withAssignments(
      await this.usersService.activate(id, currentUser.id),
    );
  }

  @Patch(':id/deactivate')
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    if (id === currentUser.id) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    return this.withAssignments(
      await this.usersService.deactivate(id, currentUser.id),
    );
  }

  /** Serialises a single user with the hotels they're scoped to. */
  private async withAssignments(user: UserWithRole): Promise<UserResponseDto> {
    const byUser = await this.assignments.hotelsForUsers([user.id]);
    return new UserResponseDto(user, byUser.get(user.id) ?? []);
  }
}
