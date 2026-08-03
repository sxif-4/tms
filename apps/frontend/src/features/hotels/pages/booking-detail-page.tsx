import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  BedDoubleIcon,
  DoorOpenIcon,
  MailIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { imageUrl } from "~/lib/image-url";
import { cn } from "~/lib/utils";
import { initials } from "~/features/users/utils";
import { AssignRoomDialog } from "../components/assign-room-dialog";
import { BookingStatusBadge } from "../components/booking-status-badge";
import { gbp } from "../constants";
import {
  hotelBookingQueryOptions,
  hotelBookingsQueryOptions,
  hotelRoomsQueryOptions,
  roomTypesQueryOptions,
} from "../queries";
import { updateBookingStatusServerFn } from "../server";
import type { BookingStatus, HotelBooking } from "../types";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Whole nights between check-in and check-out — what the stay is priced on. */
function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

type StaffAction = {
  label: string;
  to: "confirmed" | "cancelled" | "completed";
  destructive?: boolean;
};

function actionsFor(status: BookingStatus): StaffAction[] {
  switch (status) {
    case "pending":
      return [
        { label: "Confirm booking", to: "confirmed" },
        { label: "Cancel booking", to: "cancelled", destructive: true },
      ];
    case "confirmed":
      return [
        { label: "Mark completed", to: "completed" },
        { label: "Cancel booking", to: "cancelled", destructive: true },
      ];
    default:
      return [];
  }
}

export function BookingDetailPage({ bookingId }: { bookingId: number }) {
  const { data: booking } = useSuspenseQuery(
    hotelBookingQueryOptions(bookingId),
  );
  return <BookingDetailContent booking={booking} />;
}

function BookingDetailContent({ booking }: { booking: HotelBooking }) {
  const queryClient = useQueryClient();
  const [assigning, setAssigning] = useState(false);
  const [pendingAction, setPendingAction] = useState<StaffAction | null>(null);

  const { data: rooms } = useSuspenseQuery(
    hotelRoomsQueryOptions(booking.hotelId),
  );
  const { data: roomTypes } = useSuspenseQuery(
    roomTypesQueryOptions(booking.hotelId),
  );
  const { data: hotelBookings } = useSuspenseQuery(
    hotelBookingsQueryOptions(booking.hotelId),
  );

  // Bookings only carry a room type id, so covers are resolved through the
  // hotel's room types — the same list the page already loads.
  const coverFor = (roomTypeId: number) => {
    const type = roomTypes.find((rt) => rt.id === roomTypeId);
    return type?.image ?? type?.images?.[0] ?? null;
  };

  const roomType = roomTypes.find((rt) => rt.id === booking.roomTypeId);
  const cover = coverFor(booking.roomTypeId);
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const nightlyRate = roomType ? Number(roomType.basePricePerNight) : null;

  // The guest's other stays at this hotel. Staff only ever see their own
  // hotel's bookings, so this can't leak another property's history.
  const history = hotelBookings.filter(
    (b) => b.userId === booking.userId && b.id !== booking.id,
  );

  const statusMutation = useMutation({
    mutationFn: () =>
      updateBookingStatusServerFn({
        data: { id: booking.id, status: pendingAction!.to },
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

  const actions = actionsFor(booking.status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit text-muted-foreground"
          >
            <Link to="/dashboard/hotel/bookings">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to bookings
            </Link>
          </Button>
          {/* The reference is the page's identity — it used to be a table
              column, and it belongs here now that the row links through. */}
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Booking {booking.bookingReference}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed {fmtDateTime(booking.createdAt)} · {booking.hotelName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {booking.roomId == null && booking.status !== "cancelled" && (
            <Button variant="outline" onClick={() => setAssigning(true)}>
              <DoorOpenIcon data-icon="inline-start" />
              Assign room
            </Button>
          )}
          {actions.map((action) => (
            <Button
              key={action.to}
              variant={action.destructive ? "outline" : "default"}
              onClick={() => setPendingAction(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[0.9fr_1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Guest</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback>{initials(booking.guestName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight">
                  {booking.guestName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Visitor · #{booking.userId}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2">
                <MailIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{booking.guestEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                <span>
                  {history.length + 1} booking
                  {history.length === 0 ? "" : "s"} at this hotel
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 shrink-0 text-muted-foreground" />
                <span>
                  {booking.guests} guest{booking.guests === 1 ? "" : "s"} on
                  this stay
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <CardTitle>Booking info</CardTitle>
            <BookingStatusBadge
              className="h-7 px-2.5 text-sm"
              status={booking.status}
            />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {/* The stay window and the money are what staff scan for, so those
                three carry the emphasis and the rest stay at body size. */}
            <Detail
              emphasis
              label="Check-in"
              value={fmtDate(booking.checkIn)}
            />
            <Detail
              emphasis
              label="Check-out"
              value={fmtDate(booking.checkOut)}
            />
            <Detail
              emphasis
              label="Duration"
              value={`${nights} night${nights === 1 ? "" : "s"}`}
            />
            <Detail label="Room type" value={booking.roomTypeName} />
            <Detail
              label="Room"
              value={
                booking.roomNumber ?? (
                  // Not an error — an outstanding task, so it wears the action
                  // colour rather than the destructive one.
                  <span className="inline-flex rounded-full bg-primary/35 px-2.5 py-0.5">
                    Unassigned
                  </span>
                )
              }
            />
            <Detail label="Party size" value={String(booking.guests)} />
            <Detail label="Reference" value={booking.bookingReference} />
            <Detail label="Last updated" value={fmtDate(booking.updatedAt)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Room</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {cover ? (
              <img
                src={imageUrl(cover)}
                alt={booking.roomTypeName}
                className="h-40 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <BedDoubleIcon className="size-6" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold tracking-tight">
                {booking.roomTypeName}
              </p>
              {roomType && (
                <p className="text-sm text-muted-foreground">
                  Sleeps up to {roomType.maxOccupancy} ·{" "}
                  {gbp(Number(roomType.basePricePerNight))}/night
                </p>
              )}
            </div>
            <Separator />
            {/* Price snapshot: `total_amount` is what was charged, so the rate
                line is shown for context and never used to re-derive it. */}
            <div className="flex flex-col gap-2">
              {nightlyRate != null && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {gbp(nightlyRate)} × {nights} night
                    {nights === 1 ? "" : "s"}
                  </span>
                  <span className="tabular-nums">
                    {gbp(nightlyRate * nights)}
                  </span>
                </div>
              )}
              <div className="flex items-end justify-between gap-3">
                <Label>Charged</Label>
                <span className="text-2xl font-semibold tracking-tight tabular-nums">
                  {gbp(Number(booking.totalAmount))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Booking history</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {history.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">
              This is {booking.guestName}'s first booking at {booking.hotelName}
              .
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Image</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Room type</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Party size</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((past) => (
                  <TableRow key={past.id}>
                    <TableCell>
                      <RoomThumb
                        alt={past.roomTypeName}
                        src={coverFor(past.roomTypeId)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:text-brand hover:underline"
                        params={{ bookingId: String(past.id) }}
                        to="/dashboard/hotel/bookings/$bookingId"
                      >
                        {past.bookingReference}
                      </Link>
                    </TableCell>
                    <TableCell>{past.roomTypeName}</TableCell>
                    <TableCell>
                      {past.roomNumber ?? (
                        <Badge variant="outline">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {fmtDate(past.checkIn)} – {fmtDate(past.checkOut)}
                    </TableCell>
                    <TableCell>{past.guests}</TableCell>
                    <TableCell className="tabular-nums">
                      {gbp(Number(past.totalAmount))}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={past.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AssignRoomDialog
        booking={assigning ? booking : null}
        onOpenChange={setAssigning}
        open={assigning}
        rooms={rooms}
      />

      <ConfirmDialog
        open={pendingAction != null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction?.label ?? ""}
        description={`Booking ${booking.bookingReference} for ${booking.guestName} will be marked ${pendingAction?.to ?? ""}.`}
        confirmLabel={pendingAction?.label ?? "Confirm"}
        destructive={pendingAction?.destructive}
        pending={statusMutation.isPending}
        onConfirm={() => statusMutation.mutate()}
      />
    </div>
  );
}

/**
 * Room-type thumbnail leading each history row. The row already names the room
 * type, so the image is decorative to a screen reader.
 */
function RoomThumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <span
        aria-hidden
        className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        title={alt}
      >
        <BedDoubleIcon className="size-5" />
      </span>
    );
  }

  return (
    <img
      alt=""
      aria-hidden
      className="h-14 w-20 shrink-0 rounded-lg object-cover"
      src={imageUrl(src)}
    />
  );
}

/**
 * One label style for every field on the page — small, spaced and muted, so the
 * eye skips the labels and lands on the values.
 */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
      {children}
    </span>
  );
}

function Detail({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: React.ReactNode;
  /** Headline facts get a size and weight step above the rest. */
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <span
        className={cn(
          "text-sm font-medium",
          emphasis && "text-lg font-semibold tracking-tight",
        )}
      >
        {value}
      </span>
    </div>
  );
}
