import { Link } from "@tanstack/react-router";
import { ArrowRight, Ship, Sparkles, Ticket } from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { gbp } from "~/features/reports/constants";
import { cn } from "~/lib/utils";
import type { TripAlert, TripPulse } from "../trip-items";

/** "Ada Lovelace" → "AL". Two letters max, so it stays legible at 40px. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/50 p-3">
      <p className="font-heading text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Book a sailing", to: "/ferry/book", icon: Ship },
  { label: "Buy park tickets", to: "/theme-park/tickets", icon: Ticket },
  { label: "See what's on", to: "/theme-park", icon: Sparkles },
] as const;

/**
 * The supporting column: who is signed in, what the trip adds up to, and what
 * still needs the guest's attention.
 *
 * Identity is deliberately one row rather than a panel — the account carries
 * no avatar, phone or address worth a card of its own, and a guest reading
 * their own bookings already knows their name. The space goes to state that
 * actually changes between visits.
 */
export function TripRail({
  name,
  email,
  memberSince,
  pulse,
  alerts,
}: {
  name: string;
  email: string;
  memberSince: string | null;
  pulse: TripPulse;
  alerts: TripAlert[];
}) {
  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
      <div className="glass-data rounded-xl border p-5">
        {/*
          Stacked and centred rather than a horizontal row: the rail is narrow,
          and a centred column gives the name and email the card's full width
          to run into before they have to truncate.

          The avatar takes an explicit size instead of `size="lg"` — that
          variant sets its width through a `data-[size=lg]` rule, which outranks
          a plain utility class on specificity and would quietly win.
        */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/20 text-lg font-semibold text-foreground">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          {/* w-full so `truncate` has a width to ellipsis against — a centred
              flex child otherwise sizes to its content and overflows. */}
          <p className="mt-3 w-full truncate font-semibold">{name}</p>
          <p className="w-full truncate text-xs text-muted-foreground">
            {email}
          </p>
          {memberSince && (
            <p className="mt-2 text-xs text-muted-foreground">
              Travelling with us since {memberSince}
            </p>
          )}
        </div>

        <Separator className="my-4" />

        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Trip pulse
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Upcoming" value={String(pulse.upcomingCount)} />
          <Stat label="Total spent" value={gbp(pulse.totalSpend)} />
        </div>
        {pulse.nights > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {pulse.nights} night{pulse.nights === 1 ? "" : "s"} booked across
            your stays.
          </p>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="glass-data rounded-xl border p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Needs attention
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <li key={alert.key} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                      alert.tone === "urgent"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {alert.detail}
                    </p>
                    {alert.action && (
                      <Button
                        asChild
                        variant="link"
                        size="sm"
                        className="mt-1 h-auto p-0 text-xs"
                      >
                        <Link to={alert.action.to}>
                          {alert.action.label}
                          <ArrowRight className="size-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="rounded-xl border p-5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Plan more
        </p>
        <div className="mt-2 flex flex-col">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.to}
                asChild
                variant="ghost"
                className="h-9 justify-start px-2 font-normal"
              >
                <Link to={action.to}>
                  <Icon className="size-4 text-muted-foreground" />
                  {action.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
