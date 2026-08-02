import {
  CalendarCheck,
  CalendarDays,
  Hotel,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";

type SearchField = {
  icon: LucideIcon;
  label: string;
  placeholder: string;
};

/**
 * Presentational only for now — the fields are focusable buttons so they can be
 * swapped for comboboxes / date pickers once the search flow is wired up.
 */
const FIELDS: SearchField[] = [
  { icon: Hotel, label: "Hotel", placeholder: "Any hotel" },
  { icon: CalendarDays, label: "Check In", placeholder: "Add date" },
  { icon: CalendarCheck, label: "Check Out", placeholder: "Add date" },
  { icon: Users, label: "Guests", placeholder: "2 guests, 1 room" },
];

export function HeroSearch({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-4xl rounded-3xl bg-white/95 p-2 shadow-2xl shadow-black/30 ring-1 ring-white/60 backdrop-blur-sm lg:flex lg:items-center lg:rounded-full",
        className,
      )}
    >
      <div className="divide-y divide-zinc-200 lg:flex lg:flex-1 lg:divide-x lg:divide-y-0">
        {FIELDS.map(({ icon: Icon, label, placeholder }) => (
          <button
            key={label}
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-zinc-100/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 lg:flex-1 lg:rounded-full lg:px-5 lg:py-2"
          >
            <Icon className="size-5 shrink-0 text-zinc-400" />
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                {label}
              </span>
              <span className="block truncate text-sm text-zinc-900">
                {placeholder}
              </span>
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 lg:mt-0 lg:ml-2 lg:w-auto lg:shrink-0"
      >
        <Search className="size-4" />
        Search Hotels
      </button>
    </div>
  );
}
