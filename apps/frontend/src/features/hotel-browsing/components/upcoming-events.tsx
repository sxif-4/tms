import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  EVENT_ICONS,
  EVENT_TYPE_LABELS,
} from "~/features/park-browsing/constants";
import type { PublicUpcomingSchedule } from "~/features/park-browsing/types";
import { imageUrl } from "~/lib/image-url";
import { cn } from "~/lib/utils";

/** Below this many places left, the run is flagged as selling out. */
const LOW_STOCK = 10;

/** Shared by every card so the whole section keeps one focus treatment. */
const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** One run's date parts, in the same en-GB wording the rest of the app uses. */
function runDate(startAt: string) {
  const date = new Date(startAt);
  return {
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
    day: date.toLocaleDateString("en-GB", { day: "2-digit" }),
    month: date.toLocaleDateString("en-GB", { month: "short" }),
    time: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/** `null` when there's nothing worth saying — plenty of places left. */
function stockNote(remaining: number): string | null {
  if (remaining <= 0) return "Sold out";
  if (remaining <= LOW_STOCK) return `${remaining} places left`;
  return null;
}

/**
 * The park's real agenda — the next few runs across every active event, from
 * `/public/park/schedules/upcoming`. Renders nothing when the park has nothing
 * scheduled, rather than showing an empty spine.
 *
 * Chronology drives the layout: the soonest run gets the poster, the ones
 * behind it get compact rows. Every card is the event's own photo, since a
 * beach night sells on the look of it rather than on its name.
 */
export function UpcomingEvents({
  schedules,
}: {
  schedules: PublicUpcomingSchedule[];
}) {
  if (schedules.length === 0) return null;

  const [next, ...rest] = schedules;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
            The programme
          </p>
          <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            What&apos;s on next.
          </h2>
          <p className="mt-5 text-base text-pretty text-muted-foreground sm:text-lg">
            Beach nights, cruises and family days. Each one needs a park ticket
            for the same day — buy the ticket, then reserve your place.
          </p>
        </div>
        <Link
          to="/theme-park"
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full border px-6 text-sm font-semibold transition-colors hover:bg-accent",
            FOCUS_RING,
          )}
        >
          See the full programme
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-12 grid gap-4 sm:mt-14 lg:grid-cols-5 lg:gap-6">
        <NextRun schedule={next} alone={rest.length === 0} />

        {rest.length > 0 && (
          <div className="flex flex-col gap-4 lg:col-span-2">
            {rest.map((schedule) => (
              <LaterRun key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * The soonest run, as a poster. Borrows the event card's full-bleed treatment,
 * but landscape and with the date punched over the photo as a ticket stub —
 * this is an agenda entry, not another item in the attractions carousel.
 */
function NextRun({
  schedule,
  alone,
}: {
  schedule: PublicUpcomingSchedule;
  alone: boolean;
}) {
  const { weekday, day, month, time } = runDate(schedule.startAt);
  const Icon = EVENT_ICONS[schedule.eventType];
  const soldOut = schedule.remaining <= 0;
  const note = stockNote(schedule.remaining);

  return (
    <Link
      to="/theme-park/events/$eventId"
      params={{ eventId: String(schedule.eventId) }}
      className={cn(
        "group relative isolate flex aspect-4/3 flex-col justify-end overflow-hidden rounded-3xl bg-muted sm:aspect-16/10",
        // On its own it would be far too tall at full width, so it flattens.
        alone ? "lg:col-span-5 lg:aspect-21/9" : "lg:col-span-3",
        FOCUS_RING,
      )}
    >
      {schedule.eventImage ? (
        <img
          src={imageUrl(schedule.eventImage)}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-series-park/30 to-series-park/5">
          <Icon className="size-32 text-series-park/35" aria-hidden />
        </div>
      )}

      {/* Strongest exactly where the stub and title sit. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/10"
      />

      <span className="absolute top-5 left-5 z-10 rounded-full bg-amber-400 px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-zinc-950 uppercase">
        Up next
      </span>

      <div className="relative z-10 flex flex-col items-start gap-5 p-5 sm:p-7">
        <DateStub weekday={weekday} day={day} month={month} time={time} />

        <div>
          <h3 className="font-serif text-3xl leading-tight font-bold text-balance text-white italic sm:text-4xl">
            {schedule.eventName}
          </h3>
          <p className="mt-2 font-mono text-[11px] tracking-[0.18em] text-white/70 uppercase">
            {EVENT_TYPE_LABELS[schedule.eventType]}
            {note ? ` · ${note}` : ""}
          </p>
        </div>

        {/* The whole card is the link — this is the affordance, not a control. */}
        <span
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-zinc-900 transition-colors group-hover:bg-white/90",
            soldOut && "bg-white/25 text-white group-hover:bg-white/35",
          )}
        >
          {soldOut ? "See other dates" : "Reserve a place"}
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

/**
 * The signature of the section: a torn ticket. The perforation splits the day
 * from the start time, which is exactly how the two read on a real stub.
 */
function DateStub({
  weekday,
  day,
  month,
  time,
}: {
  weekday: string;
  day: string;
  month: string;
  time: string;
}) {
  return (
    <span className="flex items-stretch rounded-xl bg-background/95 shadow-lg shadow-black/20 backdrop-blur-md">
      <span className="flex flex-col items-center justify-center px-4 py-2.5">
        <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
          {weekday}
        </span>
        <span className="font-mono text-2xl leading-none font-semibold tabular-nums">
          {day}
        </span>
        <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
          {month}
        </span>
      </span>

      <span aria-hidden className="my-2.5 border-l border-dashed" />

      <span className="flex flex-col justify-center gap-1 px-4 py-2.5">
        <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
          Starts
        </span>
        <span className="font-mono text-lg leading-none font-semibold tabular-nums">
          {time}
        </span>
      </span>
    </span>
  );
}

/**
 * A run further down the agenda. Same photo-first idea at a listing's weight,
 * with the image panel stretching so the rows fill the poster's height.
 */
function LaterRun({ schedule }: { schedule: PublicUpcomingSchedule }) {
  const { weekday, day, month, time } = runDate(schedule.startAt);
  const Icon = EVENT_ICONS[schedule.eventType];
  const note = stockNote(schedule.remaining);

  return (
    <Link
      to="/theme-park/events/$eventId"
      params={{ eventId: String(schedule.eventId) }}
      className={cn(
        "group flex min-h-28 flex-1 gap-4 overflow-hidden rounded-2xl border bg-card p-2.5 transition-colors hover:bg-accent/50",
        FOCUS_RING,
      )}
    >
      <span className="relative w-28 shrink-0 self-stretch overflow-hidden rounded-xl bg-muted sm:w-32">
        {schedule.eventImage ? (
          <img
            src={imageUrl(schedule.eventImage)}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-series-park/30 to-series-park/5">
            <Icon className="size-10 text-series-park/40" aria-hidden />
          </span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-2">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          {weekday} {day} {month} · {time}
        </span>
        <span className="truncate font-serif text-lg leading-tight font-bold italic sm:text-xl">
          {schedule.eventName}
        </span>
        <span className="text-xs text-muted-foreground">
          {EVENT_TYPE_LABELS[schedule.eventType]}
          {note ? ` · ${note}` : ""}
        </span>
      </span>

      <ArrowUpRight className="mt-2 mr-2 size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </Link>
  );
}
