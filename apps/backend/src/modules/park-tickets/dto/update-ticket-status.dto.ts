import { IsIn } from 'class-validator';

/**
 * Staff may only cancel or refund. `used` is reachable solely through the gate
 * validation endpoint, so check-in always leaves an audit trail.
 */
export const TICKET_STATUS_TRANSITIONS = ['cancelled', 'refunded'] as const;
export type TicketStatusTransition = (typeof TICKET_STATUS_TRANSITIONS)[number];

export class UpdateTicketStatusDto {
  @IsIn(TICKET_STATUS_TRANSITIONS)
  status!: TicketStatusTransition;
}
