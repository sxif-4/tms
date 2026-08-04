import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Ship } from "lucide-react";
import { useEffect, useState } from "react";
import { ClientOnly } from "~/components/client-only";
import { ModeToggle } from "~/components/mode-toggle";
import { cn } from "~/lib/utils";

/**
 * Mirrors the planned timetable on the ferry page. Both should read from the
 * ferry schedules domain once a public endpoint exists.
 */
const CROSSINGS = [
  { time: "08:00", from: "Mainland", to: "Island" },
  { time: "11:00", from: "Island", to: "Mainland" },
  { time: "14:00", from: "Mainland", to: "Island" },
  { time: "17:00", from: "Island", to: "Mainland" },
] as const;

const BOOK_LINKS = [
  { label: "Hotels & rooms", to: "/hotels" },
  { label: "Ferry crossings", to: "/ferry" },
  { label: "Theme park", to: "/theme-park" },
  { label: "Park tickets", to: "/theme-park/tickets" },
  { label: "Island map", to: "/map" },
] as const;

const ACCOUNT_LINKS = [
  { label: "My bookings", to: "/my-bookings" },
  { label: "Sign in", to: "/login" },
  { label: "Create an account", to: "/signup" },
] as const;

const linkClass =
  "text-sm text-white/60 transition-colors hover:text-white focus-visible:text-white";

const headingClass =
  "font-mono text-[11px] font-semibold tracking-[0.22em] uppercase";

export function SiteFooter() {
  return (
    // The page always ends on night, in either theme, so everything inside is
    // painted with the white/alpha ramp rather than the light/dark tokens.
    <footer className="bg-footer text-white">
      <CrossingsBoard />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link
              to="/"
              className="text-2xl font-extrabold tracking-tight"
              aria-label="FUNISLAND home"
            >
              FUNISLAND
            </Link>
            <p className="mt-4 max-w-sm text-sm text-pretty text-white/60">
              Rooms, crossings, ride days, and beach nights on a single trip —
              and a single reference number to show at the gate.
            </p>

            <Link
              to="/hotels"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Plan a trip
              <ArrowRight className="size-4" />
            </Link>

            <p className="mt-7 font-mono text-[11px] tracking-[0.18em] text-white/35 uppercase">
              3°12′N 73°04′E
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
            <div>
              <h2 className={headingClass}>Book the trip</h2>
              <ul className="mt-5 space-y-3">
                {BOOK_LINKS.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className={linkClass}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className={headingClass}>Your bookings</h2>
              <ul className="mt-5 space-y-3">
                {ACCOUNT_LINKS.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className={linkClass}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h2 className={headingClass}>Island desk</h2>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link to="/about" className={linkClass}>
                    About the island
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:guests@funisland.example"
                    className={linkClass}
                  >
                    Guest services
                  </a>
                </li>
                <li>
                  <Link to="/login" className={linkClass}>
                    Staff sign in
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 sm:mt-16 lg:flex-row lg:items-center lg:justify-between">
          {/* The footer's own take on PaymentTrustBadges — that component is
              token-styled and would go unreadable on this ink in light mode. */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-white/80" />
              Secure checkout
            </span>
            {["Visa", "Mastercard", "Amex"].map((card) => (
              <span
                key={card}
                className="rounded-md border border-white/15 px-2 py-0.5"
              >
                {card}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <p className="text-xs text-white/45">
              © 2026 FUNISLAND · Prices in GBP
            </p>
            <ModeToggle className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white dark:border-white/20 dark:bg-transparent dark:hover:bg-white/10" />
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * The jetty board. You can only reach the island by ferry, so the footer signs
 * off with the day's sailings rather than a mailing-list box — and the sailing
 * you'd catch next is marked against the clock.
 */
function CrossingsBoard() {
  return (
    <div className="border-b border-dashed border-white/12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* The clock is client-only: the server has no business guessing what
            time it is where the reader is standing. */}
        <ClientOnly fallback={<Board />}>
          <LiveBoard />
        </ClientOnly>
      </div>
    </div>
  );
}

function Board({
  clock,
  waitLabel,
  nextIndex,
}: {
  clock?: string;
  waitLabel?: string;
  nextIndex?: number;
}) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p
            className={cn(
              headingClass,
              "flex items-center gap-2 text-white/50",
            )}
          >
            <Ship className="size-3.5" />
            Ferry crossings
          </p>
          <p className="mt-2.5 text-sm text-white/60">
            Island time{" "}
            <span className="font-mono font-semibold tabular-nums text-white">
              {clock ?? "--:--"}
            </span>
            {waitLabel ? <> · next sailing in {waitLabel}</> : null}
          </p>
        </div>

        <Link
          to="/ferry"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-70"
        >
          All sailings and fares
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* Scrolls as one strip on narrow screens — a board is read across. */}
      <ul className="-mx-4 mt-7 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:mt-8 sm:gap-4 sm:px-6 lg:mx-0 lg:px-0">
        {CROSSINGS.map(({ time, from, to }, i) => {
          const isNext = i === nextIndex;

          return (
            <li
              key={time}
              aria-current={isNext ? "true" : undefined}
              className={cn(
                "min-w-40 flex-1 shrink-0 snap-start rounded-2xl border border-white/10 bg-white/4 px-4 py-3.5",
                isNext && "border-amber-400/50 bg-amber-400/10",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <time
                  dateTime={time}
                  className={cn(
                    "font-mono text-lg font-semibold tabular-nums sm:text-xl",
                    isNext && "text-amber-300",
                  )}
                >
                  {time}
                </time>
                {isNext && (
                  <span className="font-mono text-[10px] tracking-[0.18em] text-amber-300 uppercase">
                    Next
                  </span>
                )}
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs whitespace-nowrap text-white/55">
                {from}
                <ArrowRight className="size-3 shrink-0" aria-hidden />
                {to}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-xs text-white/45">
        Crossings are held with your room — book a stay and pick a sailing as
        you go.
      </p>
    </>
  );
}

/** Minutes past midnight for an "HH:MM" sailing time. */
function toMinutes(time: string) {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

/** Re-renders every half minute — enough for a clock showing hours and minutes. */
function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The board against the clock: which sailing is next, and how long the wait is. */
function LiveBoard() {
  const now = useNow();

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const found = CROSSINGS.findIndex((c) => toMinutes(c.time) > minutesNow);
  // Past the last sailing, the next one is the first of tomorrow.
  const nextIndex = found === -1 ? 0 : found;
  const wait =
    (toMinutes(CROSSINGS[nextIndex].time) - minutesNow + 1440) % 1440;
  const hours = Math.floor(wait / 60);

  return (
    <Board
      clock={`${pad(now.getHours())}:${pad(now.getMinutes())}`}
      waitLabel={hours > 0 ? `${hours}h ${wait % 60}m` : `${wait % 60}m`}
      nextIndex={nextIndex}
    />
  );
}
