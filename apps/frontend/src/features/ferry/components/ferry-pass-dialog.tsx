import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { AnchorIcon, PrinterIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { FERRY_DIRECTION_LABELS, gbp } from "../constants";
import { ferryPassQueryOptions } from "../queries";
import type { FerryPass } from "../bookings-types";

const fmtDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * The ferry pass itself — what the operator hands (or prints) for the guest.
 * The QR encodes the booking reference, which is exactly what the boarding
 * screen accepts typed or pasted, so the printed text below it is a working
 * fallback rather than decoration.
 */
export function FerryPassDialog({
  bookingId,
  open,
  onOpenChange,
}: {
  bookingId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data: pass,
    isLoading,
    isError,
    error,
  } = useQuery(ferryPassQueryOptions(open ? bookingId : null));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* data-print-root: app.css prints this subtree alone. */}
      <DialogContent data-print-root className="sm:max-w-md">
        <DialogHeader className="print:hidden">
          <DialogTitle>Ferry pass</DialogTitle>
          <DialogDescription>
            Show this at the jetty. The reference works typed or scanned.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Loading pass…
          </p>
        ) : isError ? (
          <p className="text-destructive py-8 text-center text-sm">
            {error instanceof Error
              ? error.message
              : "Failed to load the pass."}
          </p>
        ) : pass ? (
          <FerryPassBody pass={pass} />
        ) : null}

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => window.print()} disabled={!pass}>
            <PrinterIcon data-icon="inline-start" />
            Print pass
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Split out so the boarding screen and a future visitor page can reuse it. */
export function FerryPassBody({ pass }: { pass: FerryPass }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Passenger
          </p>
          <p className="font-medium">{pass.guestName}</p>
          <p className="text-muted-foreground text-sm">
            {pass.passengerCount} passenger
            {pass.passengerCount === 1 ? "" : "s"} ·{" "}
            {gbp(Number(pass.totalAmount))}
          </p>
        </div>
        <AnchorIcon className="text-series-ferry size-8 shrink-0" />
      </div>

      {/* Dark-on-white regardless of theme: inverting a QR breaks scanners. */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-4">
        <div className="rounded-md bg-white p-3">
          <QRCodeSVG
            value={pass.bookingReference}
            size={148}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
            aria-label={`QR code for ferry booking ${pass.bookingReference}`}
          />
        </div>
        <p className="font-mono text-lg font-semibold tracking-widest">
          {pass.bookingReference}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border p-4 text-sm">
        <PassField label="Route" value={pass.routeName} />
        <PassField
          label="Direction"
          value={FERRY_DIRECTION_LABELS[pass.direction]}
        />
        <PassField label="From" value={pass.origin} />
        <PassField label="To" value={pass.destination} />
        <PassField label="Departs" value={fmtDateTime(pass.departureAt)} />
        <PassField
          label="Issued"
          value={pass.issuedAt ? fmtDateTime(pass.issuedAt) : "Not yet issued"}
        />
        <PassField label="Stay" value={pass.hotelName} />
        <PassField
          label="Hotel booking"
          value={pass.hotelBookingReference}
          mono
        />
      </dl>

      {pass.validatedAt ? (
        <p className="rounded-lg bg-emerald-500/10 p-3 text-center text-sm text-emerald-800 dark:text-emerald-300">
          Boarded {fmtDateTime(pass.validatedAt)}
        </p>
      ) : null}
    </div>
  );
}

function PassField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className={mono ? "font-mono text-sm" : "text-sm"}>{value}</dd>
    </div>
  );
}
