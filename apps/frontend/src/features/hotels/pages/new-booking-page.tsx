import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  BedDoubleIcon,
  CalendarCheckIcon,
  CheckIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { imageUrl } from "~/lib/image-url";
import { cn } from "~/lib/utils";
import {
  BookingDetails,
  PaymentFields,
  SOURCE_LABELS,
  type BookingDetailFields,
} from "../components/booking-payment-fields";
import { EmptyState } from "../components/empty-state";
import {
  GuestPicker,
  type GuestMode,
  type NewGuestFields,
} from "../components/guest-picker";
import { HotelSwitcher } from "../components/hotel-switcher";
import {
  blockedReason,
  NoRoomTypes,
  RoomAvailabilityCard,
  UNASSIGNED,
} from "../components/room-availability-card";
import { defaultStay, gbp, toDateKey } from "../constants";
import { useCurrentHotel } from "../hooks/use-current-hotel";
import { availabilityQueryOptions } from "../queries";
import { createManualBookingServerFn } from "../server";
import type {
  GuestSearchResult,
  ManualBookingStatus,
  PaymentMethod,
} from "../types";

const DAY_MS = 86_400_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nightsBetween = (checkIn: string, checkOut: string) => {
  const from = Date.parse(checkIn);
  const to = Date.parse(checkOut);
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return 0;
  return Math.round((to - from) / DAY_MS);
};

const fmtDate = (key: string) => {
  const parsed = Date.parse(key);
  if (Number.isNaN(parsed)) return "—";
  return new Date(parsed).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export function NewBookingPage() {
  const { hotels, hotel, hotelId, setHotelId } = useCurrentHotel();

  if (!hotel || hotelId == null) {
    return (
      <EmptyState
        icon={CalendarCheckIcon}
        title="No hotel assigned yet"
        description="Your account isn't assigned to a hotel yet. Ask an administrator to assign you to one to start taking bookings."
      />
    );
  }

  return (
    <NewBookingForm
      hotelId={hotelId}
      hotelName={hotel.name}
      hotels={hotels}
      onHotelChange={setHotelId}
    />
  );
}

function NewBookingForm({
  hotelId,
  hotelName,
  hotels,
  onHotelChange,
}: {
  hotelId: number;
  hotelName: string;
  hotels: ReturnType<typeof useCurrentHotel>["hotels"];
  onHotelChange: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const today = toDateKey(new Date());
  const [stay] = useState(defaultStay);
  const [checkIn, setCheckIn] = useState(stay.checkIn);
  const [checkOut, setCheckOut] = useState(stay.checkOut);
  const [guests, setGuests] = useState(2);

  const [roomTypeId, setRoomTypeId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string>(UNASSIGNED);

  const [guestMode, setGuestMode] = useState<GuestMode>("new");
  const [selectedGuest, setSelectedGuest] = useState<GuestSearchResult | null>(
    null,
  );
  const [newGuest, setNewGuest] = useState<NewGuestFields>({
    name: "",
    email: "",
    phone: "",
  });

  const [status, setStatus] = useState<ManualBookingStatus>("confirmed");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState<BookingDetailFields>({
    source: "walk_in",
    arrivalTime: "",
    specialRequests: "",
    internalNotes: "",
  });

  const nights = nightsBetween(checkIn, checkOut);
  const datesValid = nights > 0;

  const {
    data: availability = [],
    isFetching: loadingAvailability,
    isError: availabilityFailed,
    error: availabilityError,
  } = useQuery({
    ...availabilityQueryOptions(hotelId, checkIn, checkOut),
    enabled: datesValid,
  });

  // Cheapest sellable first — sold-out and too-small types sink to the bottom
  // rather than disappearing, so the desk can still see what exists.
  const options = useMemo(() => {
    return [...availability].sort((a, b) => {
      const aBlocked = blockedReason(a, guests) != null;
      const bBlocked = blockedReason(b, guests) != null;
      if (aBlocked !== bBlocked) return aBlocked ? 1 : -1;
      return Number(a.basePricePerNight) - Number(b.basePricePerNight);
    });
  }, [availability, guests]);

  const bookable = options.filter((o) => blockedReason(o, guests) == null);
  const selected =
    availability.find((o) => o.roomTypeId === roomTypeId) ?? null;

  // Nothing fits the party at all — worth saying outright rather than leaving
  // the desk to work it out from a list of greyed cards.
  const partyTooBig =
    datesValid &&
    !loadingAvailability &&
    options.length > 0 &&
    bookable.length === 0 &&
    options.some((o) => guests > o.maxOccupancy);

  // Changing dates or party size can invalidate a choice made a moment ago.
  // Dropping it beats letting the desk quote a room the API will refuse.
  useEffect(() => {
    if (!selected) return;
    if (blockedReason(selected, guests)) {
      setRoomTypeId(null);
      setRoomId(UNASSIGNED);
      return;
    }
    // The type survived the change but the specific room may not have.
    if (
      roomId !== UNASSIGNED &&
      !selected.freeRooms.some((r) => String(r.id) === roomId)
    ) {
      setRoomId(UNASSIGNED);
    }
  }, [selected, guests, roomId]);

  const guestName =
    guestMode === "existing" ? (selectedGuest?.name ?? "") : newGuest.name;
  const guestEmail =
    guestMode === "existing" ? (selectedGuest?.email ?? "") : newGuest.email;
  const guestReady = guestName.trim() !== "" && EMAIL.test(guestEmail.trim());

  const nightly = selected ? Number(selected.basePricePerNight) : 0;
  const total = nightly * nights;

  // One reason at a time, in the order the desk works — never a dead button.
  const blocker = !datesValid
    ? "Set a check-out date after check-in"
    : !selected
      ? "Choose a room type"
      : !guestReady
        ? guestMode === "existing"
          ? "Find the guest"
          : "Add the guest's name and email"
        : null;

  const mutation = useMutation({
    mutationFn: () =>
      createManualBookingServerFn({
        data: {
          hotelId,
          roomTypeId: roomTypeId!,
          checkIn,
          checkOut,
          guests,
          name: guestName.trim(),
          email: guestEmail.trim(),
          phone:
            guestMode === "new" && newGuest.phone.trim() !== ""
              ? newGuest.phone.trim()
              : undefined,
          roomId: roomId === UNASSIGNED ? undefined : Number(roomId),
          status,
          paymentMethod: status === "confirmed" ? method : undefined,
          source: details.source,
          arrivalTime: details.arrivalTime || undefined,
          specialRequests: details.specialRequests || undefined,
          internalNotes: details.internalNotes || undefined,
        },
      }),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["hotel-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-availability"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-rooms", hotelId] });
      toast.success(`Booking ${booking.bookingReference} created`);
      void navigate({
        to: "/dashboard/hotel/bookings/$bookingId",
        params: { bookingId: String(booking.id) },
      });
    },
    // Surfaces the API's reason: sold out, room taken, hotel suspended.
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to create booking",
      ),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Button
            asChild
            className="text-muted-foreground -ml-2 w-fit"
            size="sm"
            variant="ghost"
          >
            <Link to="/dashboard/hotel/bookings">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to bookings
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            New booking
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Take a booking at the desk for {hotelName}, for a guest who called
            or walked in.
          </p>
        </div>
        <HotelSwitcher
          hotels={hotels}
          onChange={onHotelChange}
          value={hotelId}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="flex flex-col">
          <Step
            done={datesValid}
            hint={
              datesValid
                ? `${nights} night${nights === 1 ? "" : "s"}`
                : undefined
            }
            step={1}
            title="Stay"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="nb-checkin">Check-in</FieldLabel>
                <Input
                  id="nb-checkin"
                  min={today}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCheckIn(next);
                    // Keep the stay at least one night rather than leaving an
                    // impossible range on screen.
                    if (next && checkOut <= next) {
                      setCheckOut(
                        toDateKey(new Date(Date.parse(next) + DAY_MS)),
                      );
                    }
                  }}
                  type="date"
                  value={checkIn}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nb-checkout">Check-out</FieldLabel>
                <Input
                  id="nb-checkout"
                  min={toDateKey(new Date(Date.parse(checkIn) + DAY_MS))}
                  onChange={(e) => setCheckOut(e.target.value)}
                  type="date"
                  value={checkOut}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nb-guests">Guests</FieldLabel>
                <Input
                  id="nb-guests"
                  max={20}
                  min={1}
                  onChange={(e) =>
                    setGuests(Math.max(1, Number(e.target.value) || 1))
                  }
                  type="number"
                  value={guests}
                />
              </Field>
            </div>
          </Step>

          <Step
            done={selected != null}
            hint={
              datesValid && !loadingAvailability && options.length > 0
                ? `${bookable.length} of ${options.length} available`
                : undefined
            }
            step={2}
            title="Room"
          >
            {!datesValid ? (
              <p className="text-muted-foreground text-sm">
                Pick the dates first — availability depends on them.
              </p>
            ) : availabilityFailed ? (
              <p className="text-destructive text-sm">
                {availabilityError instanceof Error
                  ? availabilityError.message
                  : "Couldn't load availability."}
              </p>
            ) : loadingAvailability && availability.length === 0 ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2Icon className="size-4 animate-spin" />
                Checking availability…
              </div>
            ) : options.length === 0 ? (
              <NoRoomTypes />
            ) : (
              <>
                {partyTooBig && (
                  <div className="border-destructive/40 bg-destructive/5 mb-3 flex items-start gap-2 rounded-lg border p-3">
                    <TriangleAlertIcon className="text-destructive mt-0.5 size-4 shrink-0" />
                    <p className="text-sm">
                      Nothing here sleeps {guests}. Book two rooms, or drop the
                      party size to fit one.
                    </p>
                  </div>
                )}
                <ul
                  className={cn(
                    "flex flex-col gap-2 transition-opacity",
                    loadingAvailability && "opacity-60",
                  )}
                >
                  {options.map((option) => (
                    <RoomAvailabilityCard
                      guests={guests}
                      key={option.roomTypeId}
                      nights={nights}
                      onRoomChange={setRoomId}
                      onSelect={() => {
                        setRoomTypeId(option.roomTypeId);
                        setRoomId(UNASSIGNED);
                      }}
                      option={option}
                      roomId={roomId}
                      selected={option.roomTypeId === roomTypeId}
                    />
                  ))}
                </ul>
              </>
            )}
          </Step>

          <Step done={guestReady} step={3} title="Guest">
            <GuestPicker
              fields={newGuest}
              hotelId={hotelId}
              mode={guestMode}
              onFieldsChange={setNewGuest}
              onModeChange={setGuestMode}
              onSelect={setSelectedGuest}
              selected={selectedGuest}
            />
          </Step>

          <Step done last step={4} title="Payment">
            <div className="flex flex-col gap-4">
              <PaymentFields
                method={method}
                onMethodChange={setMethod}
                onStatusChange={setStatus}
                status={status}
                total={total}
              />
              <BookingDetails
                fields={details}
                onChange={setDetails}
                onOpenChange={setDetailsOpen}
                open={detailsOpen}
              />
            </div>
          </Step>
        </div>

        {/* Stays in view while the desk works down the page — the running total
            is the thing they're asked about mid-conversation. */}
        <aside className="lg:sticky lg:top-6">
          <div className="bg-card overflow-hidden rounded-2xl border shadow-lg">
            {/* The room the desk is selling, at a size worth looking at. Fixed
                aspect either way, so choosing one doesn't shove the card. */}
            <div className="bg-muted relative aspect-4/3 w-full">
              {selected?.image ? (
                <img
                  alt={selected.name}
                  className="size-full object-cover"
                  src={imageUrl(selected.image)}
                />
              ) : (
                <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-2">
                  <BedDoubleIcon className="size-8" />
                  <p className="text-xs">
                    {selected ? "No photo yet" : "No room chosen yet"}
                  </p>
                </div>
              )}

              {selected && (
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/45 to-transparent p-4 pt-10">
                  <p className="font-heading text-lg font-semibold text-white">
                    {selected.name}
                  </p>
                  <p className="text-xs text-white/80">
                    {roomId === UNASSIGNED
                      ? "Room assigned at check-in"
                      : `Room ${selected.freeRooms.find((r) => String(r.id) === roomId)?.roomNumber ?? ""}`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 px-5 py-4 text-sm">
              <SummaryRow label="Check-in" value={fmtDate(checkIn)} />
              <SummaryRow label="Check-out" value={fmtDate(checkOut)} />
              <SummaryRow
                label="Guests"
                value={`${guests} ${guests === 1 ? "guest" : "guests"}`}
              />
              {details.arrivalTime && (
                <SummaryRow label="Arriving" value={details.arrivalTime} />
              )}
              <SummaryRow
                label="Source"
                value={SOURCE_LABELS[details.source]}
              />

              {guestReady && (
                <>
                  <Separator />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{guestName}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {guestEmail}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {selected && nights > 0 ? (
                <SummaryRow
                  label={`${gbp(nightly)} × ${nights} night${nights === 1 ? "" : "s"}`}
                  value={gbp(total)}
                />
              ) : (
                <SummaryRow label="Nights" value={String(nights)} />
              )}
            </div>

            {/* Total and CTA sit together on their own ground — the end of the
                booking, visually separated from the running detail above. */}
            <div className="bg-muted/40 flex flex-col gap-3 border-t px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">Total</span>
                <span className="font-heading text-3xl font-semibold tabular-nums">
                  {gbp(total)}
                </span>
              </div>
              <p className="text-muted-foreground -mt-1 text-xs">
                {status === "confirmed"
                  ? `Collect now by ${method === "bank_transfer" ? "transfer" : method}.`
                  : "Outstanding — nothing collected yet."}
              </p>

              <Button
                className="w-full"
                disabled={blocker != null || mutation.isPending}
                onClick={() => mutation.mutate()}
                size="lg"
                type="button"
              >
                {mutation.isPending ? "Creating…" : "Create booking"}
              </Button>
              {blocker && (
                <p className="text-muted-foreground text-center text-xs">
                  {blocker}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * A numbered step. The order is real — availability depends on the dates, and
 * the guest can't be attached before there's something to attach them to — so
 * the marker doubles as a progress indicator rather than decoration.
 */
function Step({
  step,
  title,
  hint,
  done,
  last,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  done?: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
            done
              ? "border-brand bg-brand text-brand-foreground"
              : "text-muted-foreground border-input",
          )}
        >
          {done ? <CheckIcon className="size-3.5" /> : step}
        </span>
        {!last && <span className="bg-border mt-1 w-px flex-1" />}
      </div>
      <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-8")}>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="font-heading font-semibold">{title}</h2>
          {hint && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {hint}
            </span>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
