import { cn } from "~/lib/utils";

/**
 * The ticket reference, shown large enough to read out or type in. The gate
 * screen (`/dashboard/park/gate`) accepts the reference typed or pasted, so
 * this is the whole of what the guest needs at the turnstile.
 */
export function ParkTicketCode({
  reference,
  className,
}: {
  reference: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed p-4",
        className,
      )}
    >
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        Show this at the gate
      </p>
      <p className="font-mono text-lg font-semibold tracking-widest">
        {reference}
      </p>
    </div>
  );
}
