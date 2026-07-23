import { Badge } from "~/components/ui/badge";
import {
  EVENT_BOOKING_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  TICKET_CHANNEL_LABELS,
  TICKET_STATUS_LABELS,
  eventBookingStatusBadgeVariant,
  ticketStatusBadgeVariant,
} from "../constants";
import type {
  EventBookingStatus,
  EventType,
  TicketChannel,
  TicketStatus,
} from "../types";

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant={ticketStatusBadgeVariant(status)}>
      {TICKET_STATUS_LABELS[status]}
    </Badge>
  );
}

export function EventBookingStatusBadge({
  status,
}: {
  status: EventBookingStatus;
}) {
  return (
    <Badge variant={eventBookingStatusBadgeVariant(status)}>
      {EVENT_BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}

/** Where a ticket was bought — gate sales are the ones a staff member rang up. */
export function ChannelBadge({ channel }: { channel: TicketChannel }) {
  return (
    <Badge variant={channel === "gate" ? "outline" : "secondary"}>
      {TICKET_CHANNEL_LABELS[channel]}
    </Badge>
  );
}

export function EventTypeBadge({ type }: { type: EventType }) {
  return <Badge variant="outline">{EVENT_TYPE_LABELS[type]}</Badge>;
}
