import { MapIcon } from "lucide-react";
import { Card } from "~/components/ui/card";

/** Full-bleed hero card showing the live park layout render. */
export function ParkMapCard() {
  return (
    <Card className="relative flex min-h-72 flex-col justify-end p-0 text-white">
      <img
        src="/images/Group 1.png"
        alt="Wireframe layout of the theme park and its zones"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          Live
        </span>
        <MapIcon className="size-4 text-white/70" />
      </div>

      <div className="relative flex flex-col gap-2 p-4">
        <div>
          <h3 className="font-heading text-base font-medium">Park map</h3>
          <p className="text-xs text-white/70">
            Real-time attraction layout across every zone
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur-sm">
            5 zones
          </span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur-sm">
            24 rides open
          </span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur-sm">
            3 shows today
          </span>
        </div>
      </div>
    </Card>
  );
}
