import { useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { promotionUsagesQueryOptions } from "../queries";
import type { Promotion } from "../types";

const fmt = (iso: string) => new Date(iso).toLocaleDateString();

export function PromotionUsagesDialog({
  promotion,
  onClose,
}: {
  promotion: Promotion | null;
  onClose: () => void;
}) {
  const open = promotion != null;
  const { data, isLoading } = useQuery({
    ...promotionUsagesQueryOptions(promotion?.id ?? 0),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redemptions</DialogTitle>
          <DialogDescription>{promotion?.name}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data && data.length > 0 ? (
          <div className="flex max-h-80 flex-col overflow-y-auto">
            {data.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between border-b py-2 text-sm last:border-b-0"
              >
                <span className="text-muted-foreground">
                  {u.appliedToType.replace("_", " ")} #{u.appliedToId} ·{" "}
                  {fmt(u.createdAt)}
                </span>
                <span className="font-medium">−£{u.discountAmount}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No redemptions recorded yet.
          </p>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
