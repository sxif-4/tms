import { ArrowRightIcon, CompassIcon, MapPinIcon, ShipWheelIcon } from "lucide-react";
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

const routes = [
  {
    name: "Picnic Bay Express",
    stops: "Main Pier → Picnic Bay",
    capacity: "60 seats",
    frequency: "Every 30 min",
    status: "High demand",
  },
  {
    name: "Theme Park Loop",
    stops: "Main Pier → Theme Park Dock",
    capacity: "40 seats",
    frequency: "Every 45 min",
    status: "Steady",
  },
  {
    name: "Sunset Cove Route",
    stops: "Main Pier → Sunset Cove",
    capacity: "48 seats",
    frequency: "Twice daily",
    status: "Quiet",
  },
];

export function FerryRoutesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/30 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <CompassIcon className="size-3.5" />
            Route management
          </Badge>
          <Badge variant="outline">3 active services</Badge>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Ferry routes</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Monitor island routes, service frequency, and passenger capacity from one place.
            </p>
          </div>
          <Button className="w-fit">Add new route</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Route overview</CardTitle>
            <CardDescription>Live service map for the island ferry network.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {routes.map((route) => (
              <div key={route.name} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{route.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPinIcon className="size-4" />
                      {route.stops}
                    </div>
                  </div>
                  <Badge variant="outline">{route.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{route.capacity}</span>
                  <span>•</span>
                  <span>{route.frequency}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShipWheelIcon className="size-4" />
                    Vessel ready
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Quick search</CardTitle>
            <CardDescription>Find routes by destination or capacity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Search route" />
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Suggested actions: add a new stop, update frequency, or pause a low-traffic route.
            </div>
            <div className="rounded-xl bg-cyan-500/10 p-4 text-sm text-cyan-800 dark:text-cyan-300">
              Peak traffic is expected between 08:00 and 13:00. Consider adding extra capacity to Picnic Bay Express.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
