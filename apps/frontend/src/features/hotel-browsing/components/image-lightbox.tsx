import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

export function ImageLightbox({
  open,
  onOpenChange,
  images,
  index,
  onIndexChange,
  alt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  alt: string;
}) {
  const count = images.length;
  const safeIndex = count > 0 ? ((index % count) + count) % count : 0;
  const src = images[safeIndex];

  useEffect(() => {
    if (!open || count <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        onIndexChange((safeIndex - 1 + count) % count);
      } else if (e.key === "ArrowRight") {
        onIndexChange((safeIndex + 1) % count);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count, safeIndex, onIndexChange]);

  if (!src) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl border-0 bg-black/95 p-0 sm:max-w-5xl"
      >
        <DialogTitle className="sr-only">
          {alt} — photo {safeIndex + 1} of {count}
        </DialogTitle>
        <div className="relative flex min-h-[50vh] items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 text-white hover:bg-white/10 hover:text-white"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </Button>
          {count > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10 text-white hover:bg-white/10 hover:text-white"
                aria-label="Previous photo"
                onClick={() =>
                  onIndexChange((safeIndex - 1 + count) % count)
                }
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10 text-white hover:bg-white/10 hover:text-white md:right-12"
                aria-label="Next photo"
                onClick={() => onIndexChange((safeIndex + 1) % count)}
              >
                <ChevronRight className="size-6" />
              </Button>
            </>
          )}
          <img
            src={src}
            alt={`${alt} (${safeIndex + 1}/${count})`}
            className="max-h-[80vh] w-full object-contain"
          />
          {count > 1 && (
            <p
              className={cn(
                "absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full",
                "bg-black/60 px-3 py-1 text-xs text-white",
              )}
            >
              {safeIndex + 1} / {count}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
