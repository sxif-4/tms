import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Palmtree, Ticket } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export const Route = createFileRoute("/theme-park/")({
  component: ThemeParkPage,
});

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

const TICKET_TIERS = [
  { id: 1, name: "Day pass", price: 65, description: "Full-day access to all rides and shows" },
  { id: 2, name: "Family pass", price: 220, description: "2 adults + 2 children, full-day access" },
  { id: 3, name: "VIP express", price: 120, description: "Skip-the-line on all major attractions" },
];

function ThemeParkPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-series-park/15">
          <Palmtree className="size-8 text-series-park" />
        </span>
        <Badge variant="secondary" className="mt-4">
          Coming soon
        </Badge>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          Island theme park
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Rides, shows, and family adventures opening this season. Sign up
          for early access to tickets.
        </p>
      </div>

      <Card className="glass-data mt-12 overflow-hidden border-border/60">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Ticket className="size-4 text-series-park" />
            Ticket options
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {TICKET_TIERS.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-border/60 bg-background/40 p-4 text-center"
              >
                <p className="font-semibold">{t.name}</p>
                <p className="mt-1 text-2xl font-bold">{gbp(t.price)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="glass-data-strong mt-8 rounded-2xl border-border/60 p-8 text-center">
        {submitted ? (
          <div>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-series-park/15">
              <Bell className="size-6 text-series-park" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">You're on the list!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll email{" "}
              <span className="font-medium text-foreground">{email}</span>{" "}
              when theme park tickets go on sale.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-md">
            <h2 className="text-xl font-semibold">Get early access</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign up to receive opening-week ticket offers.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 text-left">
                <Label htmlFor="park-email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="park-email"
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
