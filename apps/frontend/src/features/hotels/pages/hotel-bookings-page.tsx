import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CalendarCheckIcon, DoorOpenIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
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
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
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

type StaffAction = { label: string; to: "confirmed" | "cancelled" | "completed"; destructive?: boolean };

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
    <HotelBookingsContent hotelId={hotelId} hotels={hotels} onHotelChange={setHotelId} />
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
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [assigning, setAssigning] = useState<HotelBooking | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    booking: HotelBooking;
    action: StaffAction;
  } | null>(null);

  const { data: bookings } = useSuspenseQuery(
    hotelBookingsQueryOptions(hotelId, statusFilter === "all" ? undefined : statusFilter),
  );
  const { data: rooms } = useSuspenseQuery(hotelRoomsQueryOptions(hotelId));

  const statusMutation = useMutation({
    mutationFn: () =>
      updateBookingStatusServerFn({
        data: { id: pendingAction!.booking.id, status: pendingAction!.action.to },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-dashboard"] });
      toast.success("Booking updated");
      setPendingAction(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to update booking"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Assign rooms and manage the booking lifecycle for this hotel.
          </p>
        </div>
        <HotelSwitcher hotels={hotels} value={hotelId} onChange={onHotelChange} />
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

        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={showGuestDetails}
            onCheckedChange={setShowGuestDetails}
            aria-label="Show guest details"
          />
          Show guest details
        </label>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheckIcon}
          title="No bookings"
          description="There are no bookings matching this filter yet."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room type</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const actions = actionsFor(booking.status);
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.bookingReference}
                    </TableCell>
                    <TableCell>
                      {showGuestDetails ? (
                        <div className="flex flex-col">
                          <span>{booking.guestName}</span>
                          <span className="text-xs text-muted-foreground">
                            {booking.guestEmail}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Guest ••••</span>
                      )}
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
                      <div className="flex justify-end gap-2">
                        {booking.roomId == null && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssigning(booking)}
                          >
                            <DoorOpenIcon data-icon="inline-start" />
                            Assign room
                          </Button>
                        )}
                        {actions.map((action) => (
                          <Button
                            key={action.to}
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingAction({ booking, action })}
                          >
                            {action.label}
                          </Button>
                        ))}
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
