import { CalendarDays, Ticket, Users } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_VARIANTS,
  gbp,
} from "../constants";
import type { ParkTicket } from "../types";
import { ParkTicketQr } from "./park-ticket-qr";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MyParkTicketCard({ ticket }: { ticket: ParkTicket }) {
  /**
   * Only a live ticket gets a QR. Offering a scannable code for one that's
   * already been used, cancelled or refunded just sends the guest to a gate
   * that will turn them away.
   */
  const showQr = ticket.status === "active";

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{ticket.ticketTypeName}</h3>
              <Badge variant={TICKET_STATUS_VARIANTS[ticket.status]}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Ticket className="size-3.5" />
              Park entry
              {ticket.channel === "gate" && " · bought at the gate"}
            </p>
          </div>
          <p className="text-lg font-semibold">
            {gbp(Number(ticket.totalAmount))}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Visit date
            </p>
            <p className="mt-0.5 font-medium">{formatDate(ticket.visitDate)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              Guests
            </p>
            <p className="mt-0.5 font-medium">{ticket.quantity}</p>
          </div>
        </div>

        {showQr ? (
          <ParkTicketQr
            reference={ticket.ticketReference}
            size={132}
            className="mt-4"
          />
        ) : (
          <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
            <span className="font-mono text-xs text-muted-foreground">
              Ref: {ticket.ticketReference}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
