import { QRCodeSVG } from "qrcode.react";
import { cn } from "~/lib/utils";

/**
 * The ticket reference as a scannable code, with the reference itself beneath
 * it — the gate screen (`/dashboard/park/gate`) accepts a typed or pasted
 * reference, so the text is the working fallback, not decoration.
 *
 * The code always renders dark-on-white regardless of theme: inverting a QR
 * breaks a good number of scanners, and this panel is meant to be held up to
 * one.
 */
export function ParkTicketQr({
  reference,
  size = 148,
  className,
}: {
  reference: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed p-4",
        className,
      )}
    >
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        Show this at the gate
      </p>
      <div className="rounded-md bg-white p-3">
        <QRCodeSVG
          value={reference}
          size={size}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
          aria-label={`QR code for ticket ${reference}`}
        />
      </div>
      <p className="font-mono text-lg font-semibold tracking-widest">
        {reference}
      </p>
    </div>
  );
}
