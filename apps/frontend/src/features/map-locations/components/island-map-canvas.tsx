import type { ReactNode } from "react";
import { useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { ISLAND_MAP_IMAGE_SRC, LOCATION_TYPE_COLORS, LOCATION_TYPE_LABELS } from "../constants";
import type { MapLocation } from "../types";

/** Drag/click movement below this (px) is treated as a click, not a drag. */
const DRAG_THRESHOLD_PX = 4;

function percentFromEvent(
  container: HTMLElement,
  clientX: number,
  clientY: number,
): { top: number; left: number } {
  const rect = container.getBoundingClientRect();
  const left = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  const top = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
  return { top: Math.round(top * 100) / 100, left: Math.round(left * 100) / 100 };
}

type Props = {
  locations: MapLocation[];
  className?: string;
  /** Admin mode: click-to-place + drag-to-reposition pins. Omit for read-only visitor use. */
  editable?: boolean;
  onCanvasClick?: (top: number, left: number) => void;
  onPinClick?: (location: MapLocation) => void;
  onPinDragEnd?: (id: number, top: number, left: number) => void;
  /** Extra content appended inside each pin's read-only popover (e.g. a "View hotel" link). */
  renderPopoverExtra?: (location: MapLocation) => ReactNode;
  /** Renders a legend of the location types present in `locations`. */
  showLegend?: boolean;
};

/**
 * Renders `Map_of_Island.png` full-bleed with each location as an
 * absolutely-positioned pin at `{ top, left }` percentages. In `editable`
 * mode, clicking empty canvas proposes a new pin position and pins can be
 * dragged to reposition; otherwise pins are just click/hover targets with an
 * info popover. No `window`/browser-only APIs — safe to render during SSR.
 */
export function IslandMapCanvas({
  locations,
  className,
  editable = false,
  onCanvasClick,
  onPinClick,
  onPinDragEnd,
  renderPopoverExtra,
  showLegend = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const movedRef = useRef(false);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editable || !onCanvasClick || !containerRef.current) return;
    const { top, left } = percentFromEvent(
      containerRef.current,
      e.clientX,
      e.clientY,
    );
    onCanvasClick(top, left);
  };

  const handlePinPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    location: MapLocation,
  ) => {
    if (!editable) return;
    e.stopPropagation();
    movedRef.current = false;
    setDraggingId(location.id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePinPointerMove = (
    e: React.PointerEvent<HTMLButtonElement>,
    location: MapLocation,
  ) => {
    if (!editable || draggingId !== location.id || !containerRef.current) return;
    movedRef.current = true;
    setDragPos(percentFromEvent(containerRef.current, e.clientX, e.clientY));
  };

  const handlePinPointerUp = (
    e: React.PointerEvent<HTMLButtonElement>,
    location: MapLocation,
  ) => {
    e.stopPropagation();
    if (!editable) return;
    if (draggingId === location.id) {
      if (movedRef.current && dragPos && onPinDragEnd) {
        onPinDragEnd(location.id, dragPos.top, dragPos.left);
      } else if (!movedRef.current) {
        onPinClick?.(location);
      }
    }
    setDraggingId(null);
    setDragPos(null);
  };

  const presentTypes = Array.from(new Set(locations.map((l) => l.type)));

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasClick}
      className={cn(
        "relative w-full overflow-hidden rounded-xl border bg-muted select-none",
        editable && "cursor-crosshair",
        className,
      )}
    >
      <img
        src={ISLAND_MAP_IMAGE_SRC}
        alt="Map of the island"
        className="block h-auto w-full select-none"
        draggable={false}
      />

      {locations.map((loc) => {
        const isDragging = draggingId === loc.id && dragPos;
        const top = isDragging ? dragPos.top : Number(loc.positionTop);
        const left = isDragging ? dragPos.left : Number(loc.positionLeft);
        const color = LOCATION_TYPE_COLORS[loc.type];
        const pinButton = (
          <button
            type="button"
            aria-label={`${LOCATION_TYPE_LABELS[loc.type]}: ${loc.name}`}
            className={cn(
              "group absolute z-10 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              editable && "cursor-grab active:cursor-grabbing",
            )}
            style={{ top: `${top}%`, left: `${left}%` }}
            onPointerDown={(e) => handlePinPointerDown(e, loc)}
            onPointerMove={(e) => handlePinPointerMove(e, loc)}
            onPointerUp={(e) => handlePinPointerUp(e, loc)}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="flex size-6 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110"
              style={{ backgroundColor: color }}
            >
              <span className="size-2 rounded-full bg-white" />
            </span>
            <span className="pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              {loc.name}
            </span>
          </button>
        );

        if (editable) return <div key={loc.id}>{pinButton}</div>;

        return (
          <Popover key={loc.id}>
            <PopoverTrigger asChild>{pinButton}</PopoverTrigger>
            <PopoverContent className="w-64 p-0" side="top">
              <div className="flex flex-col gap-2 p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: color }}
                  >
                    <span className="size-2 rounded-full bg-white" />
                  </span>
                  <div>
                    <p className="text-sm leading-tight font-semibold">
                      {loc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {LOCATION_TYPE_LABELS[loc.type]}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {loc.description}
                </p>
                {renderPopoverExtra?.(loc)}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}

      {showLegend && presentTypes.length > 0 && (
        <div className="glass-marketing absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg px-3 py-2">
          {presentTypes.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-xs font-medium">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: LOCATION_TYPE_COLORS[t] }}
              />
              {LOCATION_TYPE_LABELS[t]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
