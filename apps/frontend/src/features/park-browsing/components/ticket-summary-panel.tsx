import { CalendarDays, Ticket, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { gbp } from "../constants";

export interface TicketSummaryData {
  ticketTypeName?: string;
  /** `yyyy-MM-dd`. */
  visitDate?: string;
  quantity: number;
  pricePerTicket?: number;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TicketSummaryPanel({
  summary,
}: {
  summary: TicketSummaryData;
}) {
  const price = summary.pricePerTicket ?? 0;
  const total = price * summary.quantity;

  return (
    <Card className="glass-data-strong overflow-hidden">
      <CardHeader className="border-b bg-transparent">
        <CardTitle className="text-base">Ticket summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <p className="flex items-center gap-2 font-medium">
          <Ticket className="size-4 text-series-park" />
          {summary.ticketTypeName ?? "Select a ticket"}
        </p>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" />
              Visit date
            </span>
            {summary.visitDate ? (
              <span className="text-right font-medium">
                {formatDate(summary.visitDate)}
              </span>
            ) : (
              <span className="text-muted-foreground/70">
                Select on calendar
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" />
              Guests
            </span>
            <span className="font-medium">{summary.quantity}</span>
          </div>
        </div>

        {price > 0 && (
          <>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {gbp(price)} × {summary.quantity}{" "}
                {summary.quantity === 1 ? "ticket" : "tickets"}
              </span>
              <span>{gbp(total)}</span>
            </div>
          </>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <span className="font-medium">Total</span>
          <span className="text-xl font-semibold">{gbp(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
