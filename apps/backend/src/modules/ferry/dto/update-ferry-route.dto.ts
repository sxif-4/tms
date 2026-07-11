import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFerryRouteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  origin?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  destination?: string;
}
