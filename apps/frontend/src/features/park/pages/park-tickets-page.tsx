import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { PencilIcon, PlusIcon, TicketIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { EmptyState } from "~/features/hotels/components/empty-state";
import { ChannelBadge, TicketStatusBadge } from "../components/park-badges";
import { TicketTypeDialog } from "../components/ticket-type-dialog";
import {
  TICKET_CHANNELS,
  TICKET_CHANNEL_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  gbp,
} from "../constants";
import { parkTicketsQueryOptions, parkTicketTypesQueryOptions } from "../queries";
import {
  deleteParkTicketTypeServerFn,
  updateParkTicketStatusServerFn,
} from "../server";
import type {
  ParkTicket,
  ParkTicketType,
  TicketChannel,
  TicketStatus,
} from "../types";

const ALL = "all";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function ParkTicketsPage() {
  const queryClient = useQueryClient();
  const { data: ticketTypes } = useSuspenseQuery(parkTicketTypesQueryOptions);

  const [visitDate, setVisitDate] = useState("");
  const [status, setStatus] = useState<TicketStatus | typeof ALL>(ALL);
  const [channel, setChannel] = useState<TicketChannel | typeof ALL>(ALL);
  const [q, setQ] = useState("");

  const { data: tickets } = useSuspenseQuery(
    parkTicketsQueryOptions({
      visitDate: visitDate || undefined,
      status: status === ALL ? undefined : status,
      channel: channel === ALL ? undefined : channel,
      q: q.trim() || undefined,
    }),
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ParkTicketType | null>(null);
  const [deleting, setDeleting] = useState<ParkTicketType | null>(null);
  const [cancelling, setCancelling] = useState<ParkTicket | null>(null);
  const [refunding, setRefunding] = useState<ParkTicket | null>(null);

  const deleteTypeMutation = useMutation({
    mutationFn: (id: number) => deleteParkTicketTypeServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: parkTicketTypesQueryOptions.queryKey,
      });
      toast.success("Ticket type deleted");
      setDeleting(null);
    },
    // 409 when tickets were sold against it.
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to delete ticket type",
      ),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: number; status: "cancelled" | "refunded" }) =>
      updateParkTicketStatusServerFn({ data: input }),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["park-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["park-dashboard"] });
      toast.success(
        input.status === "refunded" ? "Ticket refunded" : "Ticket cancelled",
      );
      setCancelling(null);
      setRefunding(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to update ticket"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Ticket sales</h1>
        <p className="text-sm text-muted-foreground">
          The priced catalog, and every ticket sold across both channels.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Ticket types</CardTitle>
            <CardDescription>
              What visitors can buy. Changing a price never affects tickets
              already sold.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <PlusIcon data-icon="inline-start" />
            New ticket type
          </Button>
        </CardHeader>
        <CardContent>
          {ticketTypes.length === 0 ? (
            <EmptyState
              icon={TicketIcon}
              title="No ticket types yet"
              description="Create a priced tier (e.g. Day Pass, VIP Pass) before visitors can buy tickets."
              action={
                <Button
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  <PlusIcon data-icon="inline-start" />
                  New ticket type
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketTypes.map((tt) => (
                  <TableRow key={tt.id}>
                    <TableCell className="font-medium">{tt.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {gbp(Number(tt.price))}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Edit ticket type"
                        onClick={() => {
                          setEditing(tt);
                          setDialogOpen(true);
                        }}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Delete ticket type"
                        onClick={() => setDeleting(tt)}
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales</CardTitle>
          <CardDescription>
            Every ticket sold. Filter by visit day, status or channel.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="f-date" className="text-xs font-medium">
                Visit date
              </label>
              <Input
                id="f-date"
                type="date"
                className="w-40"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="f-status" className="text-xs font-medium">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TicketStatus | typeof ALL)}
              >
                <SelectTrigger id="f-status" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {TICKET_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TICKET_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="f-channel" className="text-xs font-medium">
                Channel
              </label>
              <Select
                value={channel}
                onValueChange={(v) =>
                  setChannel(v as TicketChannel | typeof ALL)
                }
              >
                <SelectTrigger id="f-channel" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All channels</SelectItem>
                  {TICKET_CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {TICKET_CHANNEL_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="f-q" className="text-xs font-medium">
                Search
              </label>
              <Input
                id="f-q"
                placeholder="Reference, buyer name or email"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {(visitDate || status !== ALL || channel !== ALL || q) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setVisitDate("");
                  setStatus(ALL);
                  setChannel(ALL);
                  setQ("");
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {tickets.length === 0 ? (
            <EmptyState
              icon={TicketIcon}
              title="No tickets match"
              description="No tickets match these filters. Try widening the date or clearing the search."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Visit date</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">
                      {t.ticketReference}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{t.buyerName}</span>
                        <span className="text-muted-foreground text-xs">
                          {t.buyerEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{t.ticketTypeName}</TableCell>
                    <TableCell>{fmtDate(t.visitDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {gbp(Number(t.totalAmount))}
                    </TableCell>
                    <TableCell>
                      <ChannelBadge channel={t.channel} />
                    </TableCell>
                    <TableCell>
                      <TicketStatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      {/* A used ticket has been through the gate — the API
                          rejects any further transition, so offer none. */}
                      {t.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRefunding(t)}
                          >
                            Refund
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelling(t)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TicketTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ticketType={editing}
      />
      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete ticket type?"
        description={`"${deleting?.name}" will be permanently removed. Types with tickets sold against them can't be deleted.`}
        confirmLabel="Delete"
        destructive
        pending={deleteTypeMutation.isPending}
        onConfirm={() => deleting && deleteTypeMutation.mutate(deleting.id)}
      />
      <ConfirmDialog
        open={cancelling != null}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Cancel this ticket?"
        description={`${cancelling?.ticketReference} will be cancelled and its seats released back to the day's capacity. The payment stays recorded — use Refund to return the money.`}
        confirmLabel="Cancel ticket"
        destructive
        pending={statusMutation.isPending}
        onConfirm={() =>
          cancelling &&
          statusMutation.mutate({ id: cancelling.id, status: "cancelled" })
        }
      />
      <ConfirmDialog
        open={refunding != null}
        onOpenChange={(o) => !o && setRefunding(null)}
        title="Refund this ticket?"
        description={`${refunding?.ticketReference} will be refunded for ${refunding ? gbp(Number(refunding.totalAmount)) : ""} and will stop counting toward revenue.`}
        confirmLabel="Refund"
        destructive
        pending={statusMutation.isPending}
        onConfirm={() =>
          refunding &&
          statusMutation.mutate({ id: refunding.id, status: "refunded" })
        }
      />
    </div>
  );
}
