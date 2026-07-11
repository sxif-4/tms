import { CalendarDaysIcon, Clock3Icon, UsersIcon } from "lucide-react";
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

const schedules = [
  {
    time: "08:30",
    route: "Picnic Bay Express",
    crew: "Crew A",
    seats: "42 / 60",
    status: "Boarding",
  },
  {
    time: "10:15",
    route: "Theme Park Loop",
    crew: "Crew B",
    seats: "28 / 40",
    status: "On time",
  },
  {
    time: "13:00",
    route: "Sunset Cove Route",
    crew: "Crew A",
    seats: "18 / 48",
    status: "Open",
  },
];

export function FerrySchedulesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/30 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <CalendarDaysIcon className="size-3.5" />
            Schedule board
          </Badge>
          <Badge variant="outline">Today • 3 sailings</Badge>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Ferry schedules</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Plan departures, assign crews, and keep each sailing aligned with expected demand.
            </p>
          </div>
          <Button className="w-fit">Create sailing</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Upcoming departures</CardTitle>
            <CardDescription>Current sailings for the day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedules.map((item) => (
              <div key={item.time} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.route}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.time}</p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="size-4" />
                    {item.seats}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock3Icon className="size-4" />
                    {item.crew}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Adjust schedule</CardTitle>
            <CardDescription>Quick controls for daily planning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Search by route or time" />
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Use this board to change departure times, reassign crew, or update route capacity before boarding begins.
            </div>
            <div className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
              The 13:00 sailing may need one additional crew member if demand rises later this afternoon.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
