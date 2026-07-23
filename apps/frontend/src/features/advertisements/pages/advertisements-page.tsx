import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Button } from "~/components/ui/button";
import { AdvertisementCard } from "../components/advertisement-card";
import { AdvertisementDialog } from "../components/advertisement-dialog";
import { advertisementsQueryOptions } from "../queries";
import { deleteAdvertisementServerFn } from "../server";
import type { Advertisement } from "../types";

export function AdvertisementsPage() {
  const queryClient = useQueryClient();
  const { data: ads } = useSuspenseQuery(advertisementsQueryOptions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [deleting, setDeleting] = useState<Advertisement | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdvertisementServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: advertisementsQueryOptions.queryKey,
      });
      toast.success("Advertisement deleted");
      setDeleting(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete"),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (ad: Advertisement) => {
    setEditing(ad);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">
            Advertisements
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage promotional banners shown across the site.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          New advertisement
        </Button>
      </div>

      {ads.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No advertisements yet. Create your first one.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ads.map((ad) => (
            <AdvertisementCard
              key={ad.id}
              ad={ad}
              onEdit={() => openEdit(ad)}
              onDelete={() => setDeleting(ad)}
            />
          ))}
        </div>
      )}

      <AdvertisementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        advertisement={editing}
      />
      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete advertisement?"
        description={`"${deleting?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
