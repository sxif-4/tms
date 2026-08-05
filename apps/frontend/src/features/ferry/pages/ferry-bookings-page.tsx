import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheckIcon,
  BanIcon,
  CalendarClockIcon,
  HotelIcon,
  TicketIcon,
  UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Combobox, type ComboboxOption } from "~/components/ui/combobox";
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
import { PageHeading } from "~/components/page-heading";
import {
  FerryBookingStatusBadge,
  HotelStatusBadge,
} from "~/features/ferry/components/ferry-badges";
import { FerryPassDialog } from "~/features/ferry/components/ferry-pass-dialog";
import {
  FERRY_BOOKING_STATUSES,
  FERRY_BOOKING_STATUS_LABELS,
  FERRY_DIRECTION_LABELS,
  gbp,
  type FerryBookingStatus,
} from "~/features/ferry/constants";
import {
  ferryBookingsQueryOptions,
  ferryHotelBookingsForUserQueryOptions,
  ferryRoutesQueryOptions,
  ferrySchedulesQueryOptions,
} from "~/features/ferry/queries";
import {
  cancelFerryBookingServerFn,
  createFerryBookingServerFn,
  issueFerryPassServerFn,
  searchFerryUsersServerFn,
} from "~/features/ferry/server";
import type { FerryBooking } from "~/features/ferry/bookings-types";
import type { FerryBookingUser } from "~/features/ferry/types";

const fmtDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDate = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

type StatusFilter = FerryBookingStatus | "all";

export function FerryBookingsPage({
  initialSearch,
}: { initialSearch?: string } = {}) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(initialSearch ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [passBookingId, setPassBookingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  // Filtering is server-side, so the query key carries the filters.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const filters = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [debouncedSearch, statusFilter],
  );

  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
  } = useQuery(ferryBookingsQueryOptions(filters));

  const invalidateBookings = () =>
    queryClient.invalidateQueries({ queryKey: ["ferry", "bookings"] });

  const issueMutation = useMutation({
    mutationFn: (id: number) => issueFerryPassServerFn({ data: { id } }),
    onSuccess: (pass, id) => {
      invalidateBookings();
      toast.success(`Pass ${pass.bookingReference} issued`);
      // The guest is standing there — show the pass straight away.
      setPassBookingId(id);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to issue ferry pass",
      ),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelFerryBookingServerFn({ data: { id } }),
    onSuccess: (booking) => {
      invalidateBookings();
      toast.success(`Booking ${booking.bookingReference} cancelled`);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel booking",
      ),
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading />

      <header className="border-border/60 bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <TicketIcon className="size-3.5" />
            Booking queue
          </Badge>
          <Badge variant="outline">{bookings.length} shown</Badge>
          {pendingCount > 0 ? (
            <Badge variant="outline">{pendingCount} awaiting a pass</Badge>
          ) : null}
        </div>
        <Button className="w-fit" onClick={() => setOpen(true)}>
          Create booking
        </Button>
      </header>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Requests</CardTitle>
              <CardDescription>
                Issue a pass once the stay checks out, then board the passenger
                at the jetty.
              </CardDescription>
            </div>
            <Input
              placeholder="Search reference, guest name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full sm:w-72"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip
              label="All"
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            />
            {FERRY_BOOKING_STATUSES.map((status) => (
              <FilterChip
                key={status}
                label={FERRY_BOOKING_STATUS_LABELS[status]}
                active={statusFilter === status}
                onClick={() => setStatusFilter(status)}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            <EmptyState>Loading ferry bookings…</EmptyState>
          ) : isError ? (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
              {error instanceof Error
                ? error.message
                : "Failed to load ferry bookings."}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState>
              No bookings match this filter.
              {search ? " Try a different search term." : ""}
            </EmptyState>
          ) : (
            bookings.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                onIssue={() => issueMutation.mutate(booking.id)}
                onViewPass={() => setPassBookingId(booking.id)}
                onCancel={() => cancelMutation.mutate(booking.id)}
                busy={issueMutation.isPending || cancelMutation.isPending}
              />
            ))
          )}
        </CardContent>
      </Card>

      <FerryPassDialog
        bookingId={passBookingId}
        open={passBookingId != null}
        onOpenChange={(next) => {
          if (!next) setPassBookingId(null);
        }}
      />

      <CreateBookingDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={invalidateBookings}
      />
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border/70 text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
      {children}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </Button>
  );
}

/**
 * One request, with everything needed to decide on it: who is travelling, on
 * what sailing, and which stay authorises it. The action is status-dependent —
 * issuing a pass and boarding are different jobs at different moments.
 */
function BookingRow({
  booking,
  onIssue,
  onViewPass,
  onCancel,
  busy,
}: {
  booking: FerryBooking;
  onIssue: () => void;
  onViewPass: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const cancellable =
    booking.status === "pending" || booking.status === "confirmed";

  return (
    <div className="border-border/60 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-medium">
              {booking.bookingReference}
            </p>
            <FerryBookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm">
            <UserIcon className="text-muted-foreground size-3.5 shrink-0" />
            <span className="font-medium">{booking.guestName}</span>
            <span className="text-muted-foreground truncate">
              {booking.guestEmail}
            </span>
          </p>
        </div>
        <p className="text-sm font-medium tabular-nums">
          {gbp(Number(booking.totalAmount))}
        </p>
      </div>

      <dl className="text-muted-foreground mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <CalendarClockIcon className="size-3.5 shrink-0" />
          <dt className="sr-only">Sailing</dt>
          <dd>
            {booking.routeName} · {fmtDateTime(booking.departureAt)} ·{" "}
            {FERRY_DIRECTION_LABELS[booking.direction]}
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <HotelIcon className="size-3.5 shrink-0" />
          <dt className="sr-only">Stay</dt>
          <dd className="flex flex-wrap items-center gap-1.5">
            <span>
              {booking.hotelName} · {fmtDate(booking.hotelCheckIn)}–
              {fmtDate(booking.hotelCheckOut)}
            </span>
            <span className="font-mono text-xs">
              {booking.hotelBookingReference}
            </span>
            <HotelStatusBadge status={booking.hotelStatus} />
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {booking.passengerCount} passenger
          {booking.passengerCount === 1 ? "" : "s"}
          {booking.validatedAt
            ? ` · boarded ${fmtDateTime(booking.validatedAt)}`
            : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {cancellable ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={busy}
            >
              <BanIcon data-icon="inline-start" />
              Cancel
            </Button>
          ) : null}
          {booking.status === "pending" ? (
            <Button size="sm" onClick={onIssue} disabled={busy}>
              <BadgeCheckIcon data-icon="inline-start" />
              Issue pass
            </Button>
          ) : booking.status === "cancelled" ? null : (
            <Button variant="outline" size="sm" onClick={onViewPass}>
              View pass
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Counter booking: staff take the request on a guest's behalf. */
function CreateBookingDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [selectedUser, setSelectedUser] = useState<FerryBookingUser | null>(
    null,
  );
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [hotelBookingId, setHotelBookingId] = useState("");
  const [passengerCount, setPassengerCount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: schedules = [] } = useQuery(ferrySchedulesQueryOptions);
  const { data: routes = [] } = useQuery(ferryRoutesQueryOptions);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedUserSearch(userSearch), 300);
    return () => clearTimeout(handle);
  }, [userSearch]);

  const { data: userResults = [], isFetching: isUserSearchLoading } = useQuery({
    queryKey: ["ferry", "user-search", debouncedUserSearch] as const,
    queryFn: () =>
      searchFerryUsersServerFn({
        data: { q: debouncedUserSearch || undefined },
      }),
    staleTime: 10 * 1000,
    enabled: open,
  });

  const { data: hotelBookingOptions = [], isLoading: isHotelBookingsLoading } =
    useQuery(ferryHotelBookingsForUserQueryOptions(selectedUser?.id ?? null));

  const routeMap = useMemo(
    () => Object.fromEntries(routes.map((route) => [route.id, route.name])),
    [routes],
  );

  const userOptions: ComboboxOption[] = useMemo(() => {
    const options = userResults.map((user) => ({
      value: String(user.id),
      label: user.name,
      description: user.email,
    }));
    if (
      selectedUser &&
      !options.some((option) => option.value === String(selectedUser.id))
    ) {
      options.unshift({
        value: String(selectedUser.id),
        label: selectedUser.name,
        description: selectedUser.email,
      });
    }
    return options;
  }, [userResults, selectedUser]);

  // Only sailings that can still be booked — the API rejects the rest anyway.
  const scheduleOptions: ComboboxOption[] = useMemo(
    () =>
      schedules
        .filter(
          (schedule) =>
            schedule.status === "scheduled" &&
            new Date(schedule.departureAt).getTime() > Date.now(),
        )
        .map((schedule) => ({
          value: String(schedule.id),
          label: `${routeMap[schedule.routeId] ?? `Route ${schedule.routeId}`} · ${fmtDateTime(schedule.departureAt)}`,
          description: `${FERRY_DIRECTION_LABELS[schedule.direction]} · ${schedule.capacity} seats · ${gbp(Number(schedule.basePrice))}/ticket`,
        })),
    [schedules, routeMap],
  );

  const hotelBookingComboOptions: ComboboxOption[] = useMemo(
    () =>
      hotelBookingOptions.map((booking) => ({
        value: String(booking.id),
        label: `${booking.hotelName} · ${fmtDate(booking.checkIn)}–${fmtDate(booking.checkOut)}`,
        description: booking.bookingReference,
      })),
    [hotelBookingOptions],
  );

  const selectedSchedule = schedules.find(
    (schedule) => String(schedule.id) === scheduleId,
  );
  const totalPreview =
    selectedSchedule && passengerCount !== ""
      ? Number(selectedSchedule.basePrice) * Number(passengerCount)
      : 0;

  const reset = () => {
    setSelectedUser(null);
    setUserSearch("");
    setDebouncedUserSearch("");
    setScheduleId("");
    setHotelBookingId("");
    setPassengerCount("");
    setFormError(null);
  };

  const mutation = useMutation({
    mutationFn: () =>
      createFerryBookingServerFn({
        data: {
          userId: selectedUser!.id,
          scheduleId: Number(scheduleId),
          hotelBookingId: Number(hotelBookingId),
          passengerCount: Number(passengerCount),
        },
      }),
    onSuccess: (created) => {
      onCreated();
      toast.success(`Ferry booking ${created.bookingReference} created`);
      onOpenChange(false);
      reset();
    },
    onError: (err) =>
      setFormError(
        err instanceof Error ? err.message : "Failed to create ferry booking",
      ),
  });

  const canSubmit =
    selectedUser != null &&
    scheduleId !== "" &&
    hotelBookingId !== "" &&
    Number(passengerCount) > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create ferry booking</DialogTitle>
          <DialogDescription>
            The reference is generated automatically. The booking starts
            awaiting a pass — issue it from the queue once you have taken
            payment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="booking-user">Guest</Label>
            <Combobox
              id="booking-user"
              options={userOptions}
              value={selectedUser ? String(selectedUser.id) : ""}
              onChange={(value) => {
                const found = userResults.find(
                  (user) => String(user.id) === value,
                );
                setSelectedUser(found ?? null);
                setHotelBookingId("");
              }}
              onSearchChange={setUserSearch}
              loading={isUserSearchLoading}
              placeholder="Search by name or email"
              searchPlaceholder="Search guests…"
              emptyText="No matching guests."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-schedule">Sailing</Label>
            <Combobox
              id="booking-schedule"
              options={scheduleOptions}
              value={scheduleId}
              onChange={setScheduleId}
              placeholder="Select a sailing"
              searchPlaceholder="Search sailings…"
              emptyText="No upcoming sailings."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-hotel">Hotel booking</Label>
            <Combobox
              id="booking-hotel"
              options={hotelBookingComboOptions}
              value={hotelBookingId}
              onChange={setHotelBookingId}
              loading={isHotelBookingsLoading}
              disabled={!selectedUser}
              placeholder={
                selectedUser ? "Select a hotel booking" : "Select a guest first"
              }
              searchPlaceholder="Search hotel bookings…"
              emptyText="This guest has no confirmed stay to travel on."
            />
            <p className="text-muted-foreground text-xs">
              Only confirmed stays covering the sailing date authorise ferry
              travel.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="booking-passengers">Passenger count</Label>
              <Input
                id="booking-passengers"
                type="number"
                min="1"
                value={passengerCount}
                onChange={(event) => setPassengerCount(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Total</Label>
              <p className="text-muted-foreground flex h-8 items-center text-sm tabular-nums">
                {gbp(totalPreview)}
              </p>
            </div>
          </div>

          {formError ? (
            <p className="text-destructive text-sm">{formError}</p>
          ) : null}
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
            {mutation.isPending ? "Creating…" : "Create booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
