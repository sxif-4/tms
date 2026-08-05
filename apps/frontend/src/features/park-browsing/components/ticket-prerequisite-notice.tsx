import { Link } from "@tanstack/react-router";
import { Info, LogIn, Ticket } from "lucide-react";
import { Button } from "~/components/ui/button";
import { utcDateKey } from "../constants";
import type { ParkTicket, PublicSchedule } from "../types";

/**
 * Booking a ride, show or beach event requires a park ticket the visitor owns,
 * still `active`, for the *same UTC day* the schedule runs on, covering at
 * least as many people as they're booking seats for. The API enforces all of
 * that (`EventBookingsService.create`); this mirrors it so we never render an
 * enabled Book button the server is going to reject.
 *
 * Note the seat cap is checked per booking, not cumulatively across bookings:
 * a 3-person ticket can book 3 seats on the parade *and* 3 on the fire show —
 * the same three people attending both.
 */
export type PrerequisiteState =
  | { kind: "no-schedule" }
  | { kind: "sold-out" }
  | { kind: "loading" }
  | { kind: "signed-out"; dateKey: string }
  | { kind: "needs-ticket"; dateKey: string }
  | { kind: "ready"; eligible: ParkTicket[] };

export function ticketPrerequisiteState({
  schedule,
  tickets,
  isSignedIn,
  ticketsLoading = false,
}: {
  schedule: PublicSchedule | null;
  tickets: ParkTicket[];
  isSignedIn: boolean;
  ticketsLoading?: boolean;
}): PrerequisiteState {
  if (!schedule) return { kind: "no-schedule" };

  const dateKey = utcDateKey(schedule.startAt);
  if (schedule.remaining <= 0) return { kind: "sold-out" };
  if (!isSignedIn) return { kind: "signed-out", dateKey };
  // Never tell someone to buy a ticket before we know what they already own —
  // an empty list mid-fetch looks identical to owning nothing.
  if (ticketsLoading) return { kind: "loading" };

  const eligible = tickets.filter(
    (t) => t.status === "active" && utcDateKey(t.visitDate) === dateKey,
  );
  if (eligible.length === 0) return { kind: "needs-ticket", dateKey };

  return { kind: "ready", eligible };
}

function formatDay(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/**
 * Explains why booking isn't available yet, and routes the visitor to the one
 * thing that would fix it. Renders nothing once the prerequisite is met — the
 * page takes over with the seat picker.
 */
export function TicketPrerequisiteNotice({
  state,
  onSignIn,
}: {
  state: PrerequisiteState;
  onSignIn?: () => void;
}) {
  if (state.kind === "ready") return null;

  if (state.kind === "no-schedule") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="size-4" />
        Pick a time above to book seats.
      </p>
    );
  }

  if (state.kind === "loading") {
    return (
      <p className="text-sm text-muted-foreground">
        Checking your park tickets…
      </p>
    );
  }

  if (state.kind === "sold-out") {
    return (
      <div className="rounded-lg border border-dashed p-4">
        <p className="font-medium">This time is sold out</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try another time slot — seats are released if someone cancels.
        </p>
      </div>
    );
  }

  if (state.kind === "signed-out") {
    return (
      <div className="rounded-lg border border-series-park/30 bg-series-park/5 p-4">
        <p className="font-medium">Sign in to book</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Seats are booked against a park ticket on your account.
        </p>
        <Button className="mt-3" onClick={onSignIn}>
          <LogIn className="size-4" />
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-series-park/30 bg-series-park/5 p-4">
      <p className="font-medium">
        You need a park ticket for {formatDay(state.dateKey)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Park entry comes first — rides, shows and beach events are booked
        against a ticket for the same day.
      </p>
      <Button asChild className="mt-3">
        <Link to="/theme-park/tickets" search={{ date: state.dateKey }}>
          <Ticket className="size-4" />
          Buy a park ticket for this day
        </Link>
      </Button>
    </div>
  );
}
