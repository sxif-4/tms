import { Check, Ticket } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { gbp } from "../constants";
import type { PublicTicketType } from "../types";

/**
 * One buyable park ticket tier. Unlike a hotel room type there's no gallery or
 * occupancy — a tier is a name and a price, so the card stays deliberately flat.
 */
export function TicketTypeCard({
  ticketType,
  selected = false,
  onSelect,
}: {
  ticketType: PublicTicketType;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const price = Number(ticketType.price);
  const interactive = Boolean(onSelect);

  return (
    <Card
      role={interactive ? "radio" : undefined}
      aria-checked={interactive ? selected : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "glass-data overflow-hidden transition-colors",
        interactive && "cursor-pointer hover:border-series-park/50",
        selected && "border-series-park ring-1 ring-series-park/40",
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            selected
              ? "bg-series-park/20 text-series-park"
              : "bg-muted text-muted-foreground",
          )}
        >
          {selected ? (
            <Check className="size-5" />
          ) : (
            <Ticket className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{ticketType.name}</p>
          <p className="text-sm text-muted-foreground">Per person, per day</p>
        </div>
        <p className="shrink-0 text-xl font-bold tabular-nums">{gbp(price)}</p>
      </CardContent>
    </Card>
  );
}
