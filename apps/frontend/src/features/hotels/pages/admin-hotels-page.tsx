import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  BanIcon,
  HotelIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { PageHeading } from "~/components/page-heading";
import { EmptyState } from "../components/empty-state";
import { HotelDialog } from "../components/hotel-dialog";
import { hotelsQueryOptions } from "../queries";
import { setHotelActiveServerFn } from "../server";
import type { Hotel } from "../types";

export function AdminHotelsPage() {
  const { data: hotels } = useSuspenseQuery(hotelsQueryOptions);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (hotel: Hotel) => {
    setEditing(hotel);
    setDialogOpen(true);
  };

  const suspended = hotels.filter((h) => !h.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading />
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Add hotel
        </Button>
      </div>

      {hotels.length === 0 ? (
        <EmptyState
          icon={HotelIcon}
          title="No hotels yet"
          description="Create your first hotel to start taking bookings. You can assign staff to it from the Users page."
          action={
            <Button onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              Add hotel
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"}
            </span>
            {suspended > 0 && (
              <Badge variant="outline">{suspended} suspended</Badge>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel</TableHead>
                      <TableHead className="text-right">Max rooms</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotels.map((hotel) => (
                      <HotelRow
                        key={hotel.id}
                        hotel={hotel}
                        onEdit={() => openEdit(hotel)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <HotelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hotel={editing}
      />
    </div>
  );
}

function HotelRow({ hotel, onEdit }: { hotel: Hotel; onEdit: () => void }) {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      setHotelActiveServerFn({ data: { id: hotel.id, isActive } }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: hotelsQueryOptions.queryKey });
      toast.success(
        updated.isActive
          ? `${updated.name} is taking bookings again`
          : `${updated.name} is suspended — it's hidden from visitors`,
      );
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to update hotel status",
      ),
  });

  return (
    <TableRow className={hotel.isActive ? undefined : "opacity-60"}>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{hotel.name}</span>
          {hotel.description && (
            <span className="line-clamp-1 text-sm text-muted-foreground">
              {hotel.description}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {hotel.maxRooms}
      </TableCell>
      <TableCell>
        {hotel.isActive ? (
          <Badge variant="secondary">Active</Badge>
        ) : (
          <Badge variant="outline">Suspended</Badge>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for ${hotel.name}`}
              disabled={statusMutation.isPending}
            >
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon />
              Edit details
            </DropdownMenuItem>
            {hotel.isActive ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => statusMutation.mutate(false)}
              >
                <BanIcon />
                Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => statusMutation.mutate(true)}>
                <RotateCcwIcon />
                Reinstate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
