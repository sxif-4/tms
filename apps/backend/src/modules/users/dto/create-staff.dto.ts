import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../shared/enums/role.enum';

/**
 * Admin-initiated account creation. `role` accepts any slug except `admin`
 * (rejected in the service to preserve the single-admin invariant); the
 * account's temporary password is generated server-side and returned once.
 */
export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;

  @IsEnum(Role, {
    message: `role must be one of: ${Object.values(Role).join(', ')}`,
  })
  role!: Role;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
