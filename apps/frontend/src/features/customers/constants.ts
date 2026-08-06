import type { BookingDomain } from "./types";

/**
 * Money to the penny. The shared `gbp` helper rounds to whole pounds, which
 * suits revenue charts but not a screen where staff reconcile a single charge
 * against what the customer was actually billed.
 */
export const gbpExact = (amount: string | number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));

/** Statuses that mean the booking is dead — never offer to cancel these. */
const TERMINAL_STATUSES = new Set([
  "cancelled",
  "refunded",
  "completed",
  "used",
  // A boarded passenger's trip already happened; ferry rejects the cancel.
  "validated",
]);

export const isCancellable = (status: string) => !TERMINAL_STATUSES.has(status);

/** Badge tone per booking status, shared across all four domains. */
export function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "confirmed":
    case "active":
    case "validated":
      return "default";
    case "cancelled":
      return "destructive";
    case "pending":
      return "outline";
    default:
      // completed, used, refunded — done, but not a problem.
      return "secondary";
  }
}

export const DOMAIN_LABELS: Record<BookingDomain, string> = {
  hotel: "Hotel stays",
  ferry: "Ferry travel",
  park: "Park tickets",
  event: "Event bookings",
};

/** Confirmation copy per domain — cancelling has different knock-on effects. */
export const CANCEL_WARNINGS: Record<BookingDomain, string> = {
  hotel:
    "Complimentary ferry passes for this stay will be cancelled too. Any ferry seats the guest paid for separately are left alone.",
  ferry:
    "The seat is released back to the sailing. An issued pass is refunded.",
  park: "The day's capacity is released. Event bookings made against this ticket are not cancelled automatically.",
  event: "The seats are released back to the schedule.",
};
