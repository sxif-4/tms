import { IsIn } from 'class-validator';

export const EVENT_BOOKING_TRANSITIONS = ['confirmed', 'cancelled'] as const;
export type EventBookingTransition = (typeof EVENT_BOOKING_TRANSITIONS)[number];

export class UpdateEventBookingStatusDto {
  @IsIn(EVENT_BOOKING_TRANSITIONS)
  status!: EventBookingTransition;
}
