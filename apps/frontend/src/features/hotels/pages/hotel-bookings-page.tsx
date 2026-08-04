import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  CalendarCheckIcon,
  DoorOpenIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { PageHeading } from "~/components/page-heading";
import { AssignRoomDialog } from "../components/assign-room-dialog";
import { BookingStatusBadge } from "../components/booking-status-badge";
import { EmptyState } from "../components/empty-state";
import { HotelSwitcher } from "../components/hotel-switcher";
import { BOOKING_STATUS_LABELS, BOOKING_STATUSES, gbp } from "../constants";
import { useCurrentHotel } from "../hooks/use-current-hotel";
import { hotelBookingsQueryOptions, hotelRoomsQueryOptions } from "../queries";
import { updateBookingStatusServerFn } from "../server";
import type { BookingStatus, HotelBooking } from "../types";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

type StaffAction = {
  label: string;
  to: "confirmed" | "cancelled" | "completed";
  destructive?: boolean;
};

function actionsFor(status: BookingStatus): StaffAction[] {
  switch (status) {
    case "pending":
      return [
        { label: "Confirm", to: "confirmed" },
        { label: "Cancel", to: "cancelled", destructive: true },
      ];
    case "confirmed":
      return [
        { label: "Complete", to: "completed" },
        { label: "Cancel", to: "cancelled", destructive: true },
      ];
    default:
      return [];
  }
}

export function HotelBookingsPage() {
  const { hotels, hotel, hotelId, setHotelId } = useCurrentHotel();

  if (!hotel || hotelId == null) {
    return (
      <EmptyState
        icon={CalendarCheckIcon}
        title="No hotel assigned yet"
        description="Your account isn't assigned to a hotel yet. Ask an administrator to assign you to one to get started."
      />
    );
  }

  return (
    <HotelBookingsContent
      hotelId={hotelId}
      hotels={hotels}
      onHotelChange={setHotelId}
    />
  );
}

function HotelBookingsContent({
  hotelId,
  hotels,
  onHotelChange,
}: {
  hotelId: number;
  hotels: ReturnType<typeof useCurrentHotel>["hotels"];
  onHotelChange: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigning, setAssigning] = useState<HotelBooking | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    booking: HotelBooking;
    action: StaffAction;
  } | null>(null);

  const { data: bookings } = useSuspenseQuery(
    hotelBookingsQueryOptions(
      hotelId,
      statusFilter === "all" ? undefined : statusFilter,
    ),
  );
  const { data: rooms } = useSuspenseQuery(hotelRoomsQueryOptions(hotelId));

  const statusMutation = useMutation({
    mutationFn: () =>
      updateBookingStatusServerFn({
        data: {
          id: pendingAction!.booking.id,
          status: pendingAction!.action.to,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-dashboard"] });
      toast.success("Booking updated");
      setPendingAction(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to update booking",
      ),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading />
        <HotelSwitcher
          hotels={hotels}
          value={hotelId}
          onChange={onHotelChange}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger aria-label="Filter by status" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              {BOOKING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {BOOKING_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button asChild>
          <Link to="/dashboard/hotel/bookings/new">
            <PlusIcon />
            New booking
          </Link>
        </Button>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheckIcon}
          title="No bookings"
          description="There are no bookings matching this filter yet."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Room type</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Party size</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const actions = actionsFor(booking.status);
                const canAssign =
                  booking.roomId == null && booking.status !== "cancelled";
                return (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {/* The reference moved to the detail page, so the guest
                          name is the way into it. */}
                      <Link
                        className="flex flex-col hover:text-brand"
                        params={{ bookingId: String(booking.id) }}
                        to="/dashboard/hotel/bookings/$bookingId"
                      >
                        <span className="font-medium">{booking.guestName}</span>
                        <span className="text-xs text-muted-foreground">
                          {booking.guestEmail}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>{booking.roomTypeName}</TableCell>
                    <TableCell>
                      {booking.roomNumber ?? (
                        <Badge variant="outline">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {fmtDate(booking.checkIn)} – {fmtDate(booking.checkOut)}
                    </TableCell>
                    <TableCell>{booking.guests}</TableCell>
                    <TableCell className="tabular-nums">
                      {gbp(Number(booking.totalAmount))}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          aria-label={`View booking ${booking.bookingReference}`}
                          asChild
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Link
                            params={{ bookingId: String(booking.id) }}
                            to="/dashboard/hotel/bookings/$bookingId"
                          >
                            <EyeIcon />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-label={`Actions for booking ${booking.bookingReference}`}
                              // Cancelled and completed bookings have nothing
                              // left to do, so the trigger goes inert rather
                              // than opening an empty menu.
                              disabled={!canAssign && actions.length === 0}
                              size="icon-sm"
                              variant="ghost"
                            >
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {canAssign && (
                              <DropdownMenuItem
                                onSelect={() => setAssigning(booking)}
                              >
                                <DoorOpenIcon />
                                Assign room
                              </DropdownMenuItem>
                            )}
                            {actions.map((action) => (
                              <DropdownMenuItem
                                key={action.to}
                                onSelect={() =>
                                  setPendingAction({ booking, action })
                                }
                                variant={
                                  action.destructive ? "destructive" : undefined
                                }
                              >
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AssignRoomDialog
        open={assigning != null}
        onOpenChange={(o) => !o && setAssigning(null)}
        booking={assigning}
        rooms={rooms}
      />
      <ConfirmDialog
        open={pendingAction != null}
        onOpenChange={(o) => !o && setPendingAction(null)}
        title={`${pendingAction?.action.label} booking?`}
        description={`Booking ${pendingAction?.booking.bookingReference} will be marked as ${pendingAction ? BOOKING_STATUS_LABELS[pendingAction.action.to] : ""}.`}
        confirmLabel={pendingAction?.action.label ?? "Confirm"}
        destructive={pendingAction?.action.destructive}
        pending={statusMutation.isPending}
        onConfirm={() => statusMutation.mutate()}
      />
    </div>
  );
}
