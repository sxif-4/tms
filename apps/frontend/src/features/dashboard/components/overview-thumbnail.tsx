import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

/**
 * Small cover-image thumbnail for a hotel / event row. Falls back to a tinted
 * gradient tile with a glyph if the image is missing or fails to load.
 */
export function OverviewThumbnail({
  image,
  alt,
  icon: Icon,
  accent,
  className,
}: {
  image?: string;
  alt: string;
  icon: LucideIcon;
  accent: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative size-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/10",
        className,
      )}
    >
      {image && !failed ? (
        <img
          src={image}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div
          className="flex size-full items-center justify-center text-white"
          style={{
            background: `linear-gradient(140deg, ${accent}, color-mix(in oklab, ${accent} 55%, #000))`,
          }}
        >
          <Icon className="size-5 drop-shadow-sm" />
        </div>
      )}
    </div>
  );
}
