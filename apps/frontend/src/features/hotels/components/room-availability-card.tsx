import { BedDoubleIcon, CheckIcon, UsersIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { gbp } from "../constants";
import type { RoomTypeAvailability } from "../types";

export const UNASSIGNED = "unassigned";

/** Below this, the desk should feel the pressure to close the sale. */
const SCARCE_AT = 2;
/** Above this many rooms, pips stop being countable — use a bar instead. */
const PIP_LIMIT = 12;

/** Why a room type can't be sold for this stay — null when it can. */
export function blockedReason(
  option: RoomTypeAvailability,
  guests: number,
): string | null {
  if (option.totalRooms === 0) return "No rooms yet";
  if (option.totalRooms - option.bookedRooms <= 0) return "Sold out";
  if (guests > option.maxOccupancy) return `Sleeps ${option.maxOccupancy}`;
  return null;
}

type Level = "plenty" | "scarce" | "gone";

function levelFor(option: RoomTypeAvailability): Level {
  const left = option.totalRooms - option.bookedRooms;
  if (left <= 0) return "gone";
  // Scarcity means rooms have actually gone. A two-room type with both free
  // isn't "only 2 left" — that's its whole inventory, and flagging it amber
  // would cry wolf on every small hotel.
  return left <= SCARCE_AT && left < option.totalRooms ? "scarce" : "plenty";
}

/**
 * Remaining rooms as countable pips, so "2 left" is legible without reading —
 * a bar only says "some". Falls back to a proportional bar once there are more
 * rooms than anyone counts at a glance.
 */
function Inventory({
  left,
  total,
  level,
}: {
  left: number;
  total: number;
  level: Level;
}) {
  const tone =
    level === "gone"
      ? "bg-destructive"
      : level === "scarce"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <span className="flex items-center gap-2">
      {total <= PIP_LIMIT ? (
        <span aria-hidden className="flex gap-0.5">
          {Array.from({ length: total }, (_, i) => (
            <span
              className={cn(
                "h-2.5 w-1.5 rounded-xs",
                i < left ? tone : "bg-muted-foreground/25",
              )}
              key={i}
            />
          ))}
        </span>
      ) : (
        <span
          aria-hidden
          className="bg-muted-foreground/25 h-2 w-24 overflow-hidden rounded-full"
        >
          <span
            className={cn("block h-full rounded-full", tone)}
            style={{ width: `${(left / total) * 100}%` }}
          />
        </span>
      )}
      <span
        className={cn(
          "text-xs tabular-nums",
          level === "scarce"
            ? "font-medium text-amber-700 dark:text-amber-400"
            : "text-muted-foreground",
        )}
      >
        {left === 0
          ? "Sold out"
          : level === "scarce"
            ? `Only ${left} left`
            : left === total && total > 1
              ? `All ${total} free`
              : `${left} of ${total} free`}
      </span>
    </span>
  );
}

/**
 * One room type as inventory: photo, who it sleeps, what's left of it, and —
 * once selected — the rooms actually free for the stay. Remaining count leads,
 * because that's the number the desk decides on.
 */
export function RoomAvailabilityCard({
  option,
  guests,
  nights,
  selected,
  roomId,
  onSelect,
  onRoomChange,
}: {
  option: RoomTypeAvailability;
  guests: number;
  nights: number;
  selected: boolean;
  roomId: string;
  onSelect: () => void;
  onRoomChange: (roomId: string) => void;
}) {
  const left = Math.max(option.totalRooms - option.bookedRooms, 0);
  const blocked = blockedReason(option, guests);
  const nightly = Number(option.basePricePerNight);
  const level = levelFor(option);
  const tooSmall = guests > option.maxOccupancy;

  return (
    <li>
      <div
        className={cn(
          "overflow-hidden rounded-xl border transition-all",
          selected
            ? "border-brand bg-brand/5 ring-brand shadow-sm ring-1"
            : "bg-card",
          blocked && "opacity-65",
        )}
      >
        <button
          aria-pressed={selected}
          className={cn(
            "flex w-full items-center gap-3 p-3 text-left sm:gap-4",
            "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
            blocked
              ? "cursor-not-allowed"
              : "cursor-pointer hover:bg-accent/40",
          )}
          disabled={blocked != null}
          onClick={onSelect}
          type="button"
        >
          <span
            aria-hidden
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              selected
                ? "border-brand bg-brand text-brand-foreground"
                : "border-input",
            )}
          >
            {selected && <CheckIcon className="size-3.5" strokeWidth={3} />}
          </span>

          {/* Recognising a room type by sight beats reading near-identical
              names like "Garden Villa" and "Garden Suite". */}
          <span className="bg-muted hidden size-14 shrink-0 overflow-hidden rounded-lg sm:block">
            {option.image ? (
              <img
                alt=""
                className="size-full object-cover"
                loading="lazy"
                src={option.image}
              />
            ) : (
              <span className="text-muted-foreground flex size-full items-center justify-center">
                <BedDoubleIcon className="size-5" />
              </span>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={cn(
                  "truncate",
                  selected ? "font-semibold" : "font-medium",
                )}
              >
                {option.name}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs",
                  tooSmall
                    ? "bg-destructive/10 text-destructive font-medium"
                    : "text-muted-foreground",
                )}
              >
                <UsersIcon className="size-3" />
                Sleeps {option.maxOccupancy}
              </span>
            </span>

            <span className="mt-1.5 block">
              {tooSmall ? (
                <span className="text-destructive text-xs">
                  Too small for {guests} guests
                </span>
              ) : option.totalRooms === 0 ? (
                <span className="text-muted-foreground text-xs">
                  No rooms of this type yet
                </span>
              ) : (
                <Inventory
                  left={left}
                  level={level}
                  total={option.totalRooms}
                />
              )}
            </span>
          </span>

          <span className="shrink-0 text-right">
            <span className="block font-semibold tabular-nums">
              {gbp(nightly)}
            </span>
            <span className="text-muted-foreground block text-xs">
              per night
            </span>
            {/* At one night the total just repeats the rate. */}
            {nights > 1 && !blocked && (
              <span className="mt-1 block text-xs font-medium tabular-nums">
                {gbp(nightly * nights)}
              </span>
            )}
          </span>
        </button>

        {/* Room choice belongs to the chosen type, so it lives inside the card
            rather than in a separate field the desk has to hunt for. */}
        {selected && (
          <div className="border-brand/30 bg-card flex flex-wrap items-center gap-3 border-t px-3 py-2.5">
            <label
              className="text-muted-foreground text-xs font-medium"
              htmlFor="nb-room"
            >
              Room
            </label>
            <Select onValueChange={onRoomChange} value={roomId}>
              <SelectTrigger className="w-48" id="nb-room" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Assign at check-in</SelectItem>
                {option.freeRooms.map((room) => (
                  <SelectItem key={room.id} value={String(room.id)}>
                    Room {room.roomNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-xs">
              {option.freeRooms.length} free for these dates
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

/** Shown in place of the rail when the hotel has nothing to sell at all. */
export function NoRoomTypes() {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      <p className="text-sm font-medium">No room types yet</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Add a room type and stock it with rooms before taking bookings.
      </p>
    </div>
  );
}
