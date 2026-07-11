import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CalendarClockIcon,
  Clock3Icon,
  MapPinIcon,
  ShipWheelIcon,
  TicketCheckIcon,
  UsersIcon,
} from "lucide-react";
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
import { cn } from "~/lib/utils";

const stats = [
  {
    label: "Pending validations",
    value: "12",
    hint: "Passes waiting for review",
    icon: TicketCheckIcon,
  },
  {
    label: "Today’s departures",
    value: "8",
    hint: "Across 3 active routes",
    icon: CalendarClockIcon,
  },
  {
    label: "Seats filled",
    value: "74%",
    hint: "Capacity across morning sailings",
    icon: UsersIcon,
  },
];

const schedules = [
  {
    time: "08:30",
    route: "Main Pier → Picnic Bay",
    passengers: "42 / 60",
    status: "On track",
  },
  {
    time: "10:15",
    route: "Theme Park Dock → Sunset Cove",
    passengers: "28 / 40",
    status: "Boarding",
  },
  {
    time: "13:00",
    route: "Main Pier → Picnic Bay",
    passengers: "18 / 60",
    status: "Open",
  },
];

const routeHighlights = [
  { name: "Picnic Bay", occupancy: "82%", trend: "High demand" },
  { name: "Theme Park", occupancy: "61%", trend: "Healthy" },
  { name: "Sunset Cove", occupancy: "47%", trend: "Steady" },
];

const recentRequests = [
  {
    name: "Ava Chen",
    booking: "Hotel booking confirmed",
    time: "2 min ago",
  },
  {
    name: "Noah Patel",
    booking: "Awaiting hotel validation",
    time: "11 min ago",
  },
  {
    name: "Lina Gomez",
    booking: "Ferry pass issued",
    time: "27 min ago",
  },
];

export function FerryDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-sky-500/10 via-background to-cyan-500/10 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <ShipWheelIcon className="size-3.5" />
            Ferry operations
          </Badge>
          <Badge variant="outline">Hotel-booking validation enabled</Badge>
        </div>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">
              Ferry control center
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Validate ticket requests, review sailings, and keep passenger flow smooth for the island’s busiest routes.
            </p>
          </div>
          <Button className="w-fit bg-cyan-700 text-white hover:bg-cyan-800">
            Create new schedule
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{stat.label}</CardTitle>
                  <div className="rounded-full bg-cyan-500/10 p-2 text-cyan-700 dark:text-cyan-400">
                    <Icon className="size-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Validate ferry pass</CardTitle>
                <CardDescription>
                  Confirm that a visitor has a valid hotel booking before issuing a ferry ticket.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <BadgeCheckIcon className="size-3.5" />
                Ready to verify
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input placeholder="Search booking or guest name" className="h-10" />
              <Button className="h-10">Check booking</Button>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Guest: Maria Santos</p>
                  <p className="text-sm text-muted-foreground">
                    Hotel booking: #HB-2048 • 2 nights • Deluxe room
                  </p>
                </div>
                <Badge variant="secondary">Eligible</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPinIcon className="size-4" />
                Main Pier • Departure 08:30
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Today’s departures</CardTitle>
            <CardDescription>Live schedule overview for the next few sailings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedules.map((item) => (
              <div key={item.time} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.time}</p>
                    <p className="text-sm text-muted-foreground">{item.route}</p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{item.passengers} passengers</span>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Route occupancy</CardTitle>
            <CardDescription>Quick pulse on passenger demand and capacity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {routeHighlights.map((route) => (
              <div key={route.name} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                <div>
                  <p className="font-medium">{route.name}</p>
                  <p className="text-sm text-muted-foreground">{route.trend}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-2 rounded-full bg-cyan-600",
                        route.name === "Picnic Bay" && "w-[82%]",
                        route.name === "Theme Park" && "w-[61%]",
                        route.name === "Sunset Cove" && "w-[47%]"
                      )}
                    />
                  </div>
                  <span className="min-w-10 text-sm font-medium">{route.occupancy}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Recent requests</CardTitle>
            <CardDescription>Newest visitor requests that need attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRequests.map((request) => (
              <div key={request.name} className="flex items-start justify-between rounded-lg border border-border/60 p-3">
                <div className="space-y-1">
                  <p className="font-medium">{request.name}</p>
                  <p className="text-sm text-muted-foreground">{request.booking}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3Icon className="size-4" />
                  {request.time}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
