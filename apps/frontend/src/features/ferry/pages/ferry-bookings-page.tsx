import { CheckCircle2Icon, Clock3Icon, TicketIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";

const bookings = [
  {
    guest: "Ava Chen",
    route: "Picnic Bay Express",
    seats: "2 seats",
    status: "Ready to validate",
    time: "08:30",
  },
  {
    guest: "Noah Patel",
    route: "Theme Park Loop",
    seats: "1 seat",
    status: "Awaiting hotel check",
    time: "10:15",
  },
  {
    guest: "Lina Gomez",
    route: "Sunset Cove Route",
    seats: "3 seats",
    status: "Validated",
    time: "13:00",
  },
];

export function FerryBookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/30 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <TicketIcon className="size-3.5" />
            Booking queue
          </Badge>
          <Badge variant="outline">3 requests</Badge>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Ferry bookings</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Review ferry reservations, confirm eligibility, and issue passes without interruption.
            </p>
          </div>
          <Button className="w-fit">Export list</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Pending and confirmed requests</CardTitle>
            <CardDescription>Visitors waiting for ticket approval or boarding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.guest} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{booking.guest}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{booking.route}</p>
                  </div>
                  <Badge
                    variant={booking.status === "Validated" ? "secondary" : "outline"}
                  >
                    {booking.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{booking.seats}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock3Icon className="size-4" />
                    {booking.time}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {booking.status === "Validated" ? (
                      <CheckCircle2Icon className="size-4 text-emerald-600" />
                    ) : (
                      <Clock3Icon className="size-4" />
                    )}
                    {booking.status === "Validated" ? "Ready for boarding" : "Needs review"}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Find a booking</CardTitle>
            <CardDescription>Search by guest, route, or departure time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Search bookings" />
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Booking validation is tied to hotel confirmation. Staff should confirm eligibility before issuing a ticket.
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
              2 of 3 bookings already meet the required conditions for travel today.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
