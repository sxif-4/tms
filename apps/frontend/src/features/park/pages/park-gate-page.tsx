import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  ScanLineIcon,
  ShoppingCartIcon,
  XCircleIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { GateSaleDialog } from "../components/gate-sale-dialog";
import { ChannelBadge } from "../components/park-badges";
import { gbp } from "../constants";
import { parkTicketTypesQueryOptions } from "../queries";
import { validateParkTicketServerFn } from "../server";
import type { ParkTicket } from "../types";
import { cn } from "~/lib/utils";

/** How many check-ins to keep on screen this session. */
const RECENT_LIMIT = 10;

type Result =
  | { kind: "valid"; ticket: ParkTicket }
  | { kind: "invalid"; reason: string };

type RecentCheckIn = { ticket: ParkTicket; at: Date };

const fmtTime = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

/**
 * The on-site validation screen. Deliberately spare: one big autofocused box,
 * Enter to submit, and a result card that can be read across a busy gate. The
 * failure reason comes from the API verbatim — "valid for 2026-07-15, not
 * today" is exactly what the operator needs to tell the visitor.
 */
export function ParkGatePage() {
  const queryClient = useQueryClient();
  const { data: ticketTypes } = useSuspenseQuery(parkTicketTypesQueryOptions);

  const [reference, setReference] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [recent, setRecent] = useState<RecentCheckIn[]>([]);
  const [saleOpen, setSaleOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateMutation = useMutation({
    mutationFn: (ticketReference: string) =>
      validateParkTicketServerFn({ data: { ticketReference } }),
    onSuccess: (ticket) => {
      setResult({ kind: "valid", ticket });
      setRecent((prev) => [{ ticket, at: new Date() }, ...prev].slice(0, RECENT_LIMIT));
      setReference("");
      queryClient.invalidateQueries({ queryKey: ["park-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["park-tickets"] });
      inputRef.current?.focus();
    },
    onError: (err) => {
      setResult({
        kind: "invalid",
        reason: err instanceof Error ? err.message : "Could not check in",
      });
      setReference("");
      inputRef.current?.focus();
    },
  });

  function submit() {
    const ref = reference.trim();
    if (!ref) return;
    validateMutation.mutate(ref);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Gate</h1>
          <p className="text-sm text-muted-foreground">
            Check visitors in, or sell a ticket on the spot.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSaleOpen(true)}>
          <ShoppingCartIcon data-icon="inline-start" />
          Walk-up sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check in</CardTitle>
          <CardDescription>
            Scan or type the ticket reference, then press Enter.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              // The operator's hands are on the scanner, not the mouse.
              autoFocus
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="PT-XXXXXXXX"
              aria-label="Ticket reference"
              className="h-14 font-mono text-lg tracking-wider"
            />
            <Button
              size="lg"
              className="h-14 px-8"
              onClick={submit}
              disabled={validateMutation.isPending || !reference.trim()}
            >
              {validateMutation.isPending ? "Checking…" : "Check in"}
            </Button>
          </div>

          {result && <ResultCard result={result} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checked in this session</CardTitle>
          <CardDescription>
            The last {RECENT_LIMIT} visitors you let through.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nobody checked in yet. Scanned tickets will appear here.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {recent.map(({ ticket, at }) => (
                <li
                  key={`${ticket.id}-${at.getTime()}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
                    <span className="font-mono text-xs">
                      {ticket.ticketReference}
                    </span>
                    <span className="text-sm">{ticket.buyerName}</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-3 text-xs">
                    <span>
                      {ticket.quantity} visitor
                      {ticket.quantity === 1 ? "" : "s"}
                    </span>
                    <ChannelBadge channel={ticket.channel} />
                    <span className="tabular-nums">{fmtTime(at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <GateSaleDialog
        open={saleOpen}
        onOpenChange={setSaleOpen}
        ticketTypes={ticketTypes}
        onSold={(ticket) =>
          // A walk-up buyer is standing right there — offer their new reference
          // for immediate check-in rather than making staff retype it.
          setReference(ticket.ticketReference)
        }
      />
    </div>
  );
}

/**
 * Large, unmistakable pass/fail. Green and red are load-bearing here (this is
 * a glanceable operational signal, not decoration), so each is paired with an
 * icon and words — never colour alone.
 */
function ResultCard({ result }: { result: Result }) {
  const valid = result.kind === "valid";
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-4 rounded-xl border-2 p-5",
        valid
          ? "border-emerald-600/50 bg-emerald-50 dark:bg-emerald-950/30"
          : "border-destructive/50 bg-destructive/10",
      )}
    >
      {valid ? (
        <CheckCircle2Icon className="size-10 shrink-0 text-emerald-600" />
      ) : (
        <XCircleIcon className="text-destructive size-10 shrink-0" />
      )}
      <div className="flex flex-col gap-1">
        <p
          className={cn(
            "text-xl font-semibold",
            valid ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {valid ? "Let them in" : "Do not admit"}
        </p>
        {valid ? (
          <div className="text-sm">
            <p>
              <span className="font-medium">{result.ticket.buyerName}</span> ·{" "}
              {result.ticket.ticketTypeName} · {result.ticket.quantity} visitor
              {result.ticket.quantity === 1 ? "" : "s"}
            </p>
            <p className="text-muted-foreground font-mono text-xs">
              {result.ticket.ticketReference} ·{" "}
              {gbp(Number(result.ticket.totalAmount))}
            </p>
          </div>
        ) : (
          <p className="text-sm">{result.reason}</p>
        )}
      </div>
    </div>
  );
}
