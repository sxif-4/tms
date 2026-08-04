import { FerrisWheel, Palmtree, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { EVENT_TYPE_LABELS, gbp } from "../constants";
import type { EventType, PublicEvent } from "../types";

/**
 * Events carry no images — `imageables` supports them, but nothing uploads
 * event photos yet. An icon keyed to the event type reads better than
 * borrowing a hotel photograph for a rollercoaster.
 */
const EVENT_ICONS: Record<EventType, LucideIcon> = {
  ride: FerrisWheel,
  show: Sparkles,
  beach_event: Palmtree,
};

export function EventCard({
  event,
  className,
}: {
  event: PublicEvent;
  className?: string;
}) {
  const Icon = EVENT_ICONS[event.eventType];

  return (
    <Card
      className={cn(
        "glass-data h-full overflow-hidden transition-colors hover:border-series-park/50",
        className,
      )}
    >
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-series-park/15">
            <Icon className="size-5 text-series-park" />
          </span>
          <Badge variant="secondary">
            {EVENT_TYPE_LABELS[event.eventType]}
          </Badge>
        </div>

        <h3 className="mt-4 font-semibold">{event.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {event.description}
        </p>

        <div className="mt-auto flex items-baseline gap-1.5 pt-4">
          <span className="text-lg font-bold tabular-nums">
            {gbp(Number(event.basePrice))}
          </span>
          <span className="text-xs text-muted-foreground">per person</span>
        </div>
      </CardContent>
    </Card>
  );
}
