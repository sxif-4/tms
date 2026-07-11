import { IsIn } from 'class-validator';

export const STAFF_SETTABLE_STATUSES = [
  'confirmed',
  'cancelled',
  'completed',
] as const;
export type StaffSettableStatus = (typeof STAFF_SETTABLE_STATUSES)[number];

export class UpdateBookingStatusDto {
  @IsIn(STAFF_SETTABLE_STATUSES)
  status!: StaffSettableStatus;
}
