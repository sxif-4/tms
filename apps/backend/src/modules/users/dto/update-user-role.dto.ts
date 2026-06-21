import { IsEnum } from 'class-validator';
import { Role } from '../../../shared/enums/role.enum';

export class UpdateUserRoleDto {
  @IsEnum(Role, {
    message: `role must be one of: ${Object.values(Role).join(', ')}`,
  })
  role!: Role;
}
