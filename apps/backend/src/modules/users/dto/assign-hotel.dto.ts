import { IsInt, Min } from 'class-validator';

/**
 * Scopes a `hotel_staff` account to one hotel. Hotels are the only
 * assignment-scoped domain, so the target type is implied by the route
 * rather than passed as a polymorphic `assignable_type`.
 */
export class AssignHotelDto {
  @IsInt()
  @Min(1)
  hotelId!: number;
}
