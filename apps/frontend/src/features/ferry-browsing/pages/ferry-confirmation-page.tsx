import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

/**
 * Post-reservation. Deliberately does not call the seat "confirmed" — the pass
 * is issued by staff after they check the stay, and promising otherwise would
 * send guests to the jetty with nothing to show.
 */
export function FerryConfirmationPage({ reference }: { reference?: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/15">
        <CheckCircle2 className="size-8 text-emerald-600" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Seat reserved</h1>
      <p className="text-muted-foreground mt-3">
        We have your request. Our team will check your hotel booking and issue
        your ferry pass.
      </p>

      {reference ? (
        <Card className="mt-8">
          <CardContent className="p-6">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Your reference
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-widest">
              {reference}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="text-muted-foreground mt-6 flex items-center justify-center gap-2 text-sm">
        <Clock className="size-4" />
        Awaiting your pass
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/my-bookings">View my bookings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/ferry">Back to sailings</Link>
        </Button>
      </div>
    </div>
  );
}
