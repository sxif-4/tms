import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Button } from "~/components/ui/button";
import { PromotionCard } from "../components/promotion-card";
import { PromotionDialog } from "../components/promotion-dialog";
import { PromotionUsagesDialog } from "../components/promotion-usages-dialog";
import { promotionsQueryOptions } from "../queries";
import { deletePromotionServerFn } from "../server";
import type { Promotion, PromotionTargetType } from "../types";

/**
 * Shared by admin, hotel and park. `targetType` narrows the list to one
 * domain's promotions; `title`/`description` let each page say what it owns.
 * Without them it behaves exactly as before.
 */
export function PromotionsPage({
  targetType,
  title = "Promotions",
  description = "Manage discount campaigns and view their redemptions.",
}: {
  targetType?: PromotionTargetType;
  title?: string;
  description?: string;
} = {}) {
  const queryClient = useQueryClient();
  const { data: promotions } = useSuspenseQuery(
    promotionsQueryOptions(targetType),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState<Promotion | null>(null);
  const [viewingUsages, setViewingUsages] = useState<Promotion | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePromotionServerFn({ data: { id } }),
    onSuccess: () => {
      // Prefix key — refreshes every filtered variant, not just this one.
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion deleted");
      setDeleting(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete"),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (promo: Promotion) => {
    setEditing(promo);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          New promotion
        </Button>
      </div>

      {promotions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No promotions yet. Create your first one.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => (
            <PromotionCard
              key={promo.id}
              promo={promo}
              onEdit={() => openEdit(promo)}
              onViewUsages={() => setViewingUsages(promo)}
              onDelete={() => setDeleting(promo)}
            />
          ))}
        </div>
      )}

      <PromotionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promotion={editing}
      />
      <PromotionUsagesDialog
        promotion={viewingUsages}
        onClose={() => setViewingUsages(null)}
      />
      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete promotion?"
        description={`"${deleting?.name}" will be permanently removed. Promotions with recorded usages can't be deleted.`}
        confirmLabel="Delete"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
