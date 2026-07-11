import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateFerryRouteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  origin!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  destination!: string;
}
