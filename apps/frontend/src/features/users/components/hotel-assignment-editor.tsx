import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HotelIcon, Loader2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { hotelsQueryOptions } from "~/features/hotels/queries";
import { userHotelsQueryOptions, usersQueryOptions } from "../queries";
import { assignHotelServerFn, unassignHotelServerFn } from "../server";

/**
 * Adds and removes the hotels a `hotel_staff` account is scoped to. Without at
 * least one, every hotel page the account can reach renders an empty state —
 * so this is the step that actually makes a new staff account usable.
 *
 * Rendered both from the Users grid and inline after account creation.
 */
export function HotelAssignmentEditor({ userId }: { userId: number }) {
  const queryClient = useQueryClient();
  const [pendingHotelId, setPendingHotelId] = useState<string>("");

  const assigned = useQuery(userHotelsQueryOptions(userId));
  const allHotels = useQuery(hotelsQueryOptions);

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: userHotelsQueryOptions(userId).queryKey,
    });
    // The Users grid shows each account's hotels, so it goes stale too.
    queryClient.invalidateQueries({ queryKey: usersQueryOptions.queryKey });
  };

  const assign = useMutation({
    mutationFn: (hotelId: number) =>
      assignHotelServerFn({ data: { userId, hotelId } }),
    onSuccess: (hotel) => {
      refresh();
      setPendingHotelId("");
      toast.success(`Assigned ${hotel.name}`);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to assign hotel",
      ),
  });

  const unassign = useMutation({
    mutationFn: (hotelId: number) =>
      unassignHotelServerFn({ data: { userId, hotelId } }),
    onSuccess: () => {
      refresh();
      toast.success("Removed hotel");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to remove hotel",
      ),
  });

  const assignedHotels = assigned.data ?? [];
  const assignedIds = new Set(assignedHotels.map((h) => h.hotelId));
  const available = (allHotels.data ?? []).filter(
    (h) => !assignedIds.has(h.id),
  );
  const busy = assign.isPending || unassign.isPending;

  if (assigned.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Loading assignments…
      </p>
    );
  }

  if (assigned.isError) {
    return (
      <p className="text-sm text-destructive">
        {assigned.error instanceof Error
          ? assigned.error.message
          : "Failed to load assignments"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Assigned hotels</span>
        {assignedHotels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not assigned to any hotel yet — this account can't see any hotel
            data until you add one.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignedHotels.map((hotel) => (
              <Badge
                key={hotel.assignmentId}
                variant="secondary"
                className="gap-1 py-1 pr-1 pl-2"
              >
                <HotelIcon className="size-3" />
                {hotel.name}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  disabled={busy}
                  aria-label={`Remove ${hotel.name}`}
                  onClick={() => unassign.mutate(hotel.hotelId)}
                >
                  <XIcon className="size-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={pendingHotelId}
          onValueChange={setPendingHotelId}
          disabled={busy || available.length === 0}
        >
          <SelectTrigger className="flex-1" aria-label="Hotel to assign">
            <SelectValue
              placeholder={
                available.length === 0
                  ? "No other hotels available"
                  : "Select a hotel"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {available.map((hotel) => (
                <SelectItem key={hotel.id} value={String(hotel.id)}>
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          type="button"
          disabled={busy || !pendingHotelId}
          onClick={() => assign.mutate(Number(pendingHotelId))}
        >
          {assign.isPending ? "Assigning…" : "Assign"}
        </Button>
      </div>
    </div>
  );
}
