import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { imageUrl } from "~/lib/image-url";
import { uploadAdvertisementImage } from "../images-api";
import { advertisementsQueryOptions } from "../queries";
import {
  createAdvertisementServerFn,
  updateAdvertisementServerFn,
} from "../server";
import type { Advertisement } from "../types";

/** `YYYY-MM-DD` for a date input, from an ISO string. */
const toDateInput = (iso: string) => iso.slice(0, 10);

/**
 * The banner renders this straight into an `href`. A bare `hotels` would
 * resolve relative to whatever page the visitor is on, so anything that isn't
 * an absolute URL is anchored to the site root.
 */
function normalizeTargetUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function AdvertisementDialog({
  open,
  onOpenChange,
  advertisement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement: Advertisement | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = advertisement != null;

  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed the form whenever the dialog opens (edit) or resets (create).
  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(advertisement?.title ?? "");
    setImage(advertisement?.image ?? "");
    setTargetUrl(advertisement?.targetUrl ?? "");
    setStartsAt(advertisement ? toDateInput(advertisement.startsAt) : "");
    setEndsAt(advertisement ? toDateInput(advertisement.endsAt) : "");
    setIsActive(advertisement?.isActive ?? true);
  }, [open, advertisement]);

  /**
   * Uploads immediately on pick rather than deferring to submit: `image` is a
   * URL by the time the ad is saved, so the form never has to juggle a File.
   */
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAdvertisementImage(file),
    onSuccess: (url) => {
      setImage(url);
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Upload failed"),
  });

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: title.trim(),
        image: image.trim(),
        targetUrl: normalizeTargetUrl(targetUrl),
        // The homepage slider is the only surface that renders ads.
        placement: "homepage" as const,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive,
      };
      return isEdit
        ? updateAdvertisementServerFn({
            data: { id: advertisement.id, ...payload },
          })
        : createAdvertisementServerFn({ data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: advertisementsQueryOptions.queryKey,
      });
      toast.success(isEdit ? "Advertisement updated" : "Advertisement created");
      onOpenChange(false);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Something went wrong"),
  });

  const canSubmit =
    title.trim() &&
    image.trim() &&
    targetUrl.trim() &&
    startsAt &&
    endsAt &&
    // An in-flight upload hasn't set `image` yet — saving now would store the
    // previous creative, or fail outright on create.
    !uploadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit advertisement" : "New advertisement"}
          </DialogTitle>
          <DialogDescription>
            Banners shown to visitors across the site.
          </DialogDescription>
        </DialogHeader>

        {/* Artwork sits beside its text fields rather than above them: the
            form then fits any viewport without a scroll region. */}
        <div className="grid gap-5 sm:grid-cols-[14rem_1fr]">
          <div className="flex flex-col gap-2">
            <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {image ? (
                <img
                  src={imageUrl(image)}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-6 text-muted-foreground" />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <UploadIcon data-icon="inline-start" />
              )}
              {image ? "Replace image" : "Upload image"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Landscape JPEG, PNG or WebP, up to 5MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
                // Reset so picking the same file twice still fires onChange.
                e.target.value = "";
              }}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ad-title">Title</Label>
              <Input
                id="ad-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Stay 3 nights, get theme park entry"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ad-target">Link</Label>
              <Input
                id="ad-target"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="/hotels"
              />
              <p className="text-xs text-muted-foreground">
                Where clicking the banner takes visitors.
              </p>
            </div>
          </div>
        </div>

        {/* No placement picker: the homepage slider is the only surface that
            renders ads, so there is nothing to choose between. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ad-starts">Starts</Label>
            <Input
              id="ad-starts"
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ad-ends">Ends</Label>
            <Input
              id="ad-ends"
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
          <span className="text-xs text-muted-foreground">
            — inactive banners are never shown, whatever their dates say.
          </span>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !canSubmit}
          >
            {mutation.isPending
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
