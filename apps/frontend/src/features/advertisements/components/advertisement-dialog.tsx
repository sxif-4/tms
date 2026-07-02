import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AD_PLACEMENTS, PLACEMENT_LABELS } from "../constants";
import { advertisementsQueryOptions } from "../queries";
import {
  createAdvertisementServerFn,
  updateAdvertisementServerFn,
} from "../server";
import type { AdPlacement, Advertisement } from "../types";

/** `YYYY-MM-DD` for a date input, from an ISO string. */
const toDateInput = (iso: string) => iso.slice(0, 10);

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
  const [placement, setPlacement] = useState<AdPlacement>("homepage");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seed the form whenever the dialog opens (edit) or resets (create).
  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(advertisement?.title ?? "");
    setImage(advertisement?.image ?? "");
    setTargetUrl(advertisement?.targetUrl ?? "");
    setPlacement(advertisement?.placement ?? "homepage");
    setStartsAt(advertisement ? toDateInput(advertisement.startsAt) : "");
    setEndsAt(advertisement ? toDateInput(advertisement.endsAt) : "");
    setIsActive(advertisement?.isActive ?? true);
  }, [open, advertisement]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: title.trim(),
        image: image.trim(),
        targetUrl: targetUrl.trim(),
        placement,
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
    title.trim() && image.trim() && targetUrl.trim() && startsAt && endsAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit advertisement" : "New advertisement"}
          </DialogTitle>
          <DialogDescription>
            Banners shown to visitors across the site.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ad-title">Title</Label>
            <Input
              id="ad-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ad-image">Image URL</Label>
            <Input
              id="ad-image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ad-target">Target URL</Label>
            <Input
              id="ad-target"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="/promotions"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ad-placement">Placement</Label>
            <Select
              value={placement}
              onValueChange={(v) => setPlacement(v as AdPlacement)}
            >
              <SelectTrigger id="ad-placement" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {AD_PLACEMENTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLACEMENT_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

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
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
