import { createFileRoute, Link } from "@tanstack/react-router";
import { Anchor, Bell, Clock, Ship } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export const Route = createFileRoute("/ferry/")({
  component: FerryPage,
});

const PLANNED_SCHEDULE = [
  { id: 1, route: "Mainland → Island", departure: "08:00", arrival: "10:30", days: "Daily" },
  { id: 2, route: "Island → Mainland", departure: "11:00", arrival: "13:30", days: "Daily" },
  { id: 3, route: "Mainland → Island", departure: "14:00", arrival: "16:30", days: "Daily" },
  { id: 4, route: "Island → Mainland", departure: "17:00", arrival: "19:30", days: "Daily" },
];

function FerryPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-series-ferry/15">
          <Anchor className="size-8 text-series-ferry" />
        </span>
        <Badge variant="secondary" className="mt-4">
          Coming soon
        </Badge>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Ferry service</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Daily ferries between the mainland and the island. Bookings open
          soon — be the first to know.
        </p>
      </div>

      <Card className="glass-data mt-12 overflow-hidden border-border/60">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Clock className="size-4 text-series-ferry" />
            Planned schedule
          </h2>
          <div className="mt-4 space-y-2">
            {PLANNED_SCHEDULE.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <Ship className="size-4 text-series-ferry" />
                  <span className="text-sm font-medium">{f.route}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    {f.departure} → {f.arrival}
                  </span>
                  <Badge variant="outline" className="font-normal">
                    {f.days}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="glass-data-strong mt-8 rounded-2xl border-border/60 p-8 text-center">
        {submitted ? (
          <div>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-series-ferry/15">
              <Bell className="size-6 text-series-ferry" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">You're on the list!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll email{" "}
              <span className="font-medium text-foreground">{email}</span> as
              soon as ferry bookings open.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-md">
            <h2 className="text-xl font-semibold">Get notified</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to book when ferry reservations open.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 text-left">
                <Label htmlFor="ferry-email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="ferry-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">Notify me</Button>
            </div>
          </form>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Meanwhile, <Link to="/hotels" className="underline underline-offset-4">browse hotel stays</Link>.
      </p>
    </div>
  );
}
