import { QRCodeSVG } from "qrcode.react";
import { ClientOnly } from "~/components/client-only";
import { Badge } from "~/components/ui/badge";
import { gbp } from "~/features/reports/constants";
import { cn } from "~/lib/utils";
import {
  DOMAIN_ACCENT,
  DOMAIN_LABELS,
  untilLabel,
  type TripItem,
} from "../trip-items";

function formatMoment(item: TripItem) {
  const opts: Intl.DateTimeFormatOptions =
    item.domain === "park"
      ? { weekday: "long", day: "numeric", month: "long" }
      : {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        };
  const start = item.startAt.toLocaleString("en-GB", opts);
  if (!item.endAt) return start;
  return `${item.startAt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })} → ${item.endAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  })}`;
}

/**
 * The one thing happening soonest, across all four domains.
 *
 * This is the page's focal point: a guest opening "My bookings" almost always
 * wants "what's next and when", and previously had to pick a tab and read a
 * list to find out. The card is tinted with the domain's series colour so the
 * answer is legible before any text is read, and carries the pass itself when
 * one has been issued — the jetty and the gate are where this page gets used.
 */
export function NextUpCard({ item }: { item: TripItem }) {
  const accent = DOMAIN_ACCENT[item.domain];
  const Icon = accent.icon;

  return (
    <section
      aria-labelledby="next-up-heading"
      className="glass-data relative isolate overflow-hidden rounded-xl border"
    >
      {/*
        The domain colour as a wash rather than a fill: strong enough to
        identify the domain at a glance, light enough that foreground text
        keeps its contrast in both themes.
      */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-[0.10]",
          accent.spine,
        )}
      />
      <div aria-hidden className={cn("absolute inset-x-0 top-0 h-1", accent.spine)} />

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                accent.chip,
              )}
            >
              <Icon className="size-4" />
            </span>
            <p
              id="next-up-heading"
              className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              Next up · {DOMAIN_LABELS[item.domain]}
            </p>
            {/*
              Relative time is client-only: server and browser clocks disagree
              often enough that "in 6 hours" would trip a hydration mismatch.
              The absolute date below it renders on the server either way.
            */}
            <ClientOnly>
              <Badge variant="secondary" className="font-medium">
                {untilLabel(item.startAt, Date.now())}
              </Badge>
            </ClientOnly>
          </div>

          <h2 className="font-heading mt-3 text-2xl font-semibold tracking-tight text-balance">
            {item.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="font-medium">{formatMoment(item)}</span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="font-medium tabular-nums">
              {item.free ? "Included" : gbp(item.amount)}
            </span>
            <Badge variant={item.badgeVariant}>{item.statusLabel}</Badge>
          </div>
        </div>

        {item.qr ? (
          <div className="flex shrink-0 flex-col items-center gap-2 rounded-lg border border-dashed bg-background/40 p-4">
            {/* Dark-on-white regardless of theme — inverting a QR breaks scanners. */}
            <div className="rounded-md bg-white p-2.5">
              <QRCodeSVG
                value={item.qr}
                size={104}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
                aria-label={`QR code for ${item.reference}`}
              />
            </div>
            <p className="font-mono text-sm font-semibold tracking-widest">
              {item.reference}
            </p>
          </div>
        ) : (
          <div className="shrink-0 text-sm text-muted-foreground sm:text-right">
            <p className="font-mono text-xs">{item.reference}</p>
          </div>
        )}
      </div>
    </section>
  );
}
