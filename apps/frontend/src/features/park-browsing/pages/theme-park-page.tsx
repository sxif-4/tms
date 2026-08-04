import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Palmtree, Ticket } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { EventCard } from "../components/event-card";
import { TicketTypeCard } from "../components/ticket-type-card";
import {
  publicParkEventsQueryOptions,
  publicTicketTypesQueryOptions,
} from "../queries";

export function ThemeParkPage() {
  const { data: ticketTypes } = useSuspenseQuery(publicTicketTypesQueryOptions);
  const { data: events } = useSuspenseQuery(publicParkEventsQueryOptions());

  const parkEvents = events.filter((e) => e.locationType === "theme_park");
  const beachEvents = events.filter((e) => e.locationType === "beach");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-series-park/15">
          <Palmtree className="size-8 text-series-park" />
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          Island theme park
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
          Rides, shows and beach adventures across the island. Buy your park
          ticket, then reserve the experiences you don&apos;t want to miss.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/theme-park/tickets">
              <Ticket className="size-4" />
              Buy park tickets
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/my-bookings">My tickets</Link>
          </Button>
        </div>
      </div>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Ticket options
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              One ticket per person, per day. Entry to the park is included.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ticketTypes.map((type) => (
            <TicketTypeCard key={type.id} ticketType={type} />
          ))}
        </div>
        <Button asChild className="mt-6">
          <Link to="/theme-park/tickets">
            Choose a date
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      {parkEvents.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Rides &amp; shows
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Booked separately from your park ticket, and included in the price
            shown.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parkEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {beachEvents.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Beach events
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sandbank dinners, music and sunset sailings on the picnic island.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {beachEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      <Card className="glass-data-strong mt-16">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-series-park/15">
            <CalendarDays className="size-6 text-series-park" />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold">How park tickets work</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A park ticket admits you for one chosen day. Rides, shows and
              beach events are reserved against that ticket, so buy your entry
              first and book the rest once you&apos;re in.
            </p>
          </div>
          <Button asChild>
            <Link to="/theme-park/tickets">Get started</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
