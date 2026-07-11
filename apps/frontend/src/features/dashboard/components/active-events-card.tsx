import { TicketIcon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { OverviewThumbnail } from "./overview-thumbnail";
import { Sparkline } from "./sparkline";
import { ACTIVE_EVENTS } from "../mock";

const compact = new Intl.NumberFormat("en-GB");

export function ActiveEventsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Most active events</CardTitle>
        <CardDescription>Tickets sold across live events</CardDescription>
        <CardAction>
          <TicketIcon className="size-5 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col px-2">
        {ACTIVE_EVENTS.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
          >
            <OverviewThumbnail
              image={event.image}
              alt={event.name}
              icon={event.icon}
              accent={event.accent}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{event.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {event.venue} · {event.schedule}
              </p>
            </div>
            <Sparkline
              data={event.trend}
              color={event.accent}
              className="hidden shrink-0 sm:block"
            />
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold tabular-nums">
                {compact.format(event.ticketsSold)}
              </span>
              <span className="text-xs text-muted-foreground">sold</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
