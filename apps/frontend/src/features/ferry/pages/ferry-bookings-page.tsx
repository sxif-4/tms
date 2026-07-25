import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, Clock3Icon, TicketIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ferryBookingsQueryOptions,
  ferryHotelBookingsForUserQueryOptions,
  ferryRoutesQueryOptions,
  ferrySchedulesQueryOptions,
} from "~/features/ferry/queries";
import { createFerryBookingServerFn, searchFerryUsersServerFn } from "~/features/ferry/server";
import type { FerryBooking } from "~/features/ferry/bookings-types";
import type { FerryBookingUser, FerrySchedule } from "~/features/ferry/types";

function formatBookingTime(value: string | Date | null) {
  if (!value) return "Pending";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatScheduleTime(value: string | Date) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

function getDirectionLabel(direction: FerrySchedule["direction"]) {
  return direction === "to_theme_park" ? "To theme park" : "To island";
}

function getStatusLabel(status: FerryBooking["status"]) {
  switch (status) {
    case "validated":
      return "Validated";
    case "confirmed":
      return "Confirmed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

export function FerryBookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FerryBookingUser | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [hotelBookingId, setHotelBookingId] = useState("");
  const [passengerCount, setPassengerCount] = useState("");
  const [status, setStatus] = useState<FerryBooking["status"]>("pending");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: bookings = [], isLoading, isError, error } = useQuery(
    ferryBookingsQueryOptions,
  );
  const { data: schedules = [] } = useQuery(ferrySchedulesQueryOptions);
  const { data: routes = [] } = useQuery(ferryRoutesQueryOptions);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedUserSearch(userSearch), 300);
    return () => clearTimeout(handle);
  }, [userSearch]);

  const { data: userResults = [], isFetching: isUserSearchLoading } = useQuery({
    queryKey: ["ferry", "user-search", debouncedUserSearch] as const,
    queryFn: () =>
      searchFerryUsersServerFn({ data: { q: debouncedUserSearch || undefined } }),
    staleTime: 10 * 1000,
    enabled: open,
  });

  const { data: hotelBookingOptions = [], isLoading: isHotelBookingsLoading } = useQuery(
    ferryHotelBookingsForUserQueryOptions(selectedUser?.id ?? null),
  );

  const scheduleMap = useMemo(
    () => Object.fromEntries(schedules.map((schedule) => [schedule.id, schedule])),
    [schedules],
  );
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
    if (selectedUser && !options.some((option) => option.value === String(selectedUser.id))) {
      options.unshift({
        value: String(selectedUser.id),
        label: selectedUser.name,
        description: selectedUser.email,
      });
    }
    return options;
  }, [userResults, selectedUser]);

  const scheduleOptions: ComboboxOption[] = useMemo(
    () =>
      schedules.map((schedule) => ({
        value: String(schedule.id),
        label: `${routeMap[schedule.routeId] ?? `Route ${schedule.routeId}`} · ${formatScheduleTime(schedule.departureAt)}`,
        description: `${getDirectionLabel(schedule.direction)} · ${schedule.capacity} seats · $${Number(schedule.basePrice).toFixed(2)}/ticket`,
      })),
    [schedules, routeMap],
  );

  const hotelBookingComboOptions: ComboboxOption[] = useMemo(
    () =>
      hotelBookingOptions.map((booking) => ({
        value: String(booking.id),
        label: `${booking.hotelName} · ${formatDate(booking.checkIn)}–${formatDate(booking.checkOut)}`,
        description: booking.bookingReference,
      })),
    [hotelBookingOptions],
  );

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bookings;

    return bookings.filter((booking) => {
      const routeName = routeMap[scheduleMap[booking.scheduleId]?.routeId ?? -1] ?? "";
      return [
        booking.bookingReference,
        routeName,
        getStatusLabel(booking.status),
        formatBookingTime(booking.createdAt),
        booking.passengerCount.toString(),
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [bookings, routeMap, scheduleMap, search]);

  const selectedSchedule = scheduleMap[Number(scheduleId)];
  const totalAmountPreview =
    selectedSchedule && passengerCount !== ""
      ? Number(selectedSchedule.basePrice) * Number(passengerCount)
      : 0;

  const resetForm = () => {
    setSelectedUser(null);
    setUserSearch("");
    setDebouncedUserSearch("");
    setScheduleId("");
    setHotelBookingId("");
    setPassengerCount("");
    setStatus("pending");
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
          status,
        },
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ferryBookingsQueryOptions.queryKey });
      toast.success(`Ferry booking ${created.bookingReference} created`);
      setOpen(false);
      resetForm();
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : "Failed to create ferry booking"),
  });

  const canSubmit =
    selectedUser != null &&
    scheduleId !== "" &&
    hotelBookingId !== "" &&
    passengerCount !== "" &&
    Number(passengerCount) > 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/30 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <TicketIcon className="size-3.5" />
            Booking queue
          </Badge>
          <Badge variant="outline">{bookings.length} requests</Badge>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Ferry bookings</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Review ferry reservations, confirm eligibility, and issue passes without interruption.
            </p>
          </div>
          <Button className="w-fit" onClick={() => setOpen(true)}>
            Create booking
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Pending and confirmed requests</CardTitle>
            <CardDescription>Visitors waiting for ticket approval or boarding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Loading ferry bookings…
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error instanceof Error ? error.message : "Failed to load ferry bookings."}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No bookings match your search yet.
              </div>
            ) : (
              filteredBookings.map((booking) => {
                const routeName = routeMap[scheduleMap[booking.scheduleId]?.routeId ?? -1] ?? "Unknown route";
                return (
                  <div key={booking.id} className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{booking.bookingReference}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{routeName}</p>
                      </div>
                      <Badge variant={booking.status === "validated" ? "secondary" : "outline"}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{booking.passengerCount} passenger(s)</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock3Icon className="size-4" />
                        {formatBookingTime(booking.createdAt)}
                      </span>
                      <span>•</span>
                      <span>${Number(booking.totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {booking.status === "validated" ? (
                          <CheckCircle2Icon className="size-4 text-emerald-600" />
                        ) : (
                          <Clock3Icon className="size-4" />
                        )}
                        {booking.status === "validated" ? "Ready for boarding" : "Needs review"}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        Review
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Find a booking</CardTitle>
            <CardDescription>Search by booking reference, route, or status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search bookings"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Booking validation is tied to hotel confirmation. Staff should confirm eligibility before issuing a ticket.
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
              Booking review uses the current ferry schedule and hotel booking records from the backend.
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create ferry booking</DialogTitle>
            <DialogDescription>
              Add a new ferry booking request to the system. The booking reference is generated automatically.
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
                  const found = userResults.find((user) => String(user.id) === value);
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="booking-schedule">Sailing</Label>
                <Combobox
                  id="booking-schedule"
                  options={scheduleOptions}
                  value={scheduleId}
                  onChange={setScheduleId}
                  placeholder="Select a sailing"
                  searchPlaceholder="Search sailings…"
                  emptyText="No sailings found."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="booking-status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as FerryBooking["status"])}>
                  <SelectTrigger id="booking-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                placeholder={selectedUser ? "Select a hotel booking" : "Select a guest first"}
                searchPlaceholder="Search hotel bookings…"
                emptyText="This guest has no eligible hotel bookings."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="booking-passengers">Passenger count</Label>
                <Input id="booking-passengers" type="number" min="1" value={passengerCount} onChange={(event) => setPassengerCount(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Total amount</Label>
                <p className="flex h-8 items-center text-sm text-muted-foreground">
                  ${totalAmountPreview.toFixed(2)}
                </p>
              </div>
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSubmit}>
              {mutation.isPending ? "Creating…" : "Create booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
