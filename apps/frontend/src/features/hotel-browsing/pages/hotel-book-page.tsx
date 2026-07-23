import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { addDays, format, startOfMonth } from "date-fns";
import { ArrowLeft, ArrowRight, Check, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { meQueryOptions } from "~/features/auth/queries";
import { cn } from "~/lib/utils";
import { AvailabilityCalendar } from "../components/availability-calendar";
import { BookingSummaryPanel } from "../components/booking-summary-panel";
import { InlineAuthPanel } from "../components/inline-auth-panel";
import { PaymentTrustBadges } from "../components/payment-trust-badges";
import { RoomOptionCard } from "../components/room-option-card";
import {
  availabilityCalendarQueryOptions,
  createHotelBookingMutationOptions,
  hotelAvailabilityQueryOptions,
  publicHotelQueryOptions,
} from "../queries";

const STEPS = ["Dates & room", "Contact", "Payment"] as const;

export function HotelBookPage({ hotelId }: { hotelId: number }) {
  const navigate = useNavigate();
  const { data: hotel } = useSuspenseQuery(publicHotelQueryOptions(hotelId));
  const { data: user } = useQuery(meQueryOptions);

  const [step, setStep] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [roomTypeId, setRoomTypeId] = useState<number | null>(
    hotel.roomTypes[0]?.id ?? null,
  );
  const [guests, setGuests] = useState(2);
  const [contact, setContact] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );

  const checkIn = dateRange?.from ? dateRange.from.toISOString() : "";
  const checkOut = dateRange?.to ? dateRange.to.toISOString() : "";

  const calendarFrom = format(calendarMonth, "yyyy-MM-dd");
  const calendarTo = format(addDays(calendarMonth, 60), "yyyy-MM-dd");

  const { data: calendarDays = [] } = useQuery(
    availabilityCalendarQueryOptions(
      hotelId,
      calendarFrom,
      calendarTo,
      roomTypeId ?? undefined,
    ),
  );

  const { data: availability = [] } = useQuery(
    hotelAvailabilityQueryOptions(hotelId, checkIn, checkOut),
  );

  const selectedAvailability = availability.find(
    (a) => a.roomTypeId === roomTypeId,
  );
  const nights = selectedAvailability?.nights ?? 0;

  const createBooking = useMutation({
    ...createHotelBookingMutationOptions(),
    onSuccess: (booking) => {
      toast.success("Booking confirmed!");
      void navigate({
        to: "/hotels/$hotelId/confirmation",
        params: { hotelId: String(hotelId) },
        search: { ref: booking.bookingReference },
      });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Booking failed"),
  });

  const contactValid =
    contact.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) &&
    contact.phone.trim().length >= 7;

  const canProceed = useMemo(() => {
    if (step === 0)
      return Boolean(
        checkIn &&
        checkOut &&
        roomTypeId &&
        selectedAvailability &&
        selectedAvailability.availableRooms > 0,
      );
    if (step === 1) return contactValid;
    if (step === 2) return paymentMethod.length > 0;
    return false;
  }, [
    step,
    checkIn,
    checkOut,
    roomTypeId,
    selectedAvailability,
    contactValid,
    paymentMethod,
  ]);

  const submitBooking = () => {
    if (!roomTypeId || !checkIn || !checkOut) return;
    createBooking.mutate({
      hotelId,
      roomTypeId,
      checkIn,
      checkOut,
      guests,
    });
  };

  const handlePaymentContinue = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    submitBooking();
  };

  const roomOptions =
    availability.length > 0
      ? availability.map((row) => {
          const fromHotel = hotel.roomTypes.find(
            (rt) => rt.id === row.roomTypeId,
          );
          const images =
            row.images && row.images.length > 0
              ? row.images
              : (fromHotel?.images ??
                (fromHotel?.image || row.image
                  ? [row.image ?? fromHotel?.image!].filter(Boolean)
                  : []));
          return {
            ...row,
            image: images[0] ?? row.image ?? fromHotel?.image ?? null,
            images,
            amenities: row.amenities ?? fromHotel?.amenities ?? [],
          };
        })
      : hotel.roomTypes.map((rt) => {
          const images =
            rt.images && rt.images.length > 0
              ? rt.images
              : rt.image
                ? [rt.image]
                : [];
          return {
            roomTypeId: rt.id,
            name: rt.name,
            description: rt.description,
            basePricePerNight: rt.basePricePerNight,
            maxOccupancy: rt.maxOccupancy,
            totalRooms: rt.totalRooms,
            availableRooms: rt.totalRooms,
            nights: 0,
            totalPrice: 0,
            image: images[0] ?? null,
            images,
            amenities: rt.amenities ?? [],
          };
        });

  const summaryTotal = selectedAvailability?.totalPrice;
  const mobilePriceLabel =
    summaryTotal != null && nights > 0
      ? `£${summaryTotal.toFixed(0)} total`
      : selectedAvailability
        ? `£${Number(selectedAvailability.basePricePerNight).toFixed(0)}/night`
        : "Select dates";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pb-28 sm:px-6 lg:px-8 lg:pb-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/hotels/$hotelId" params={{ hotelId: String(hotelId) }}>
          <ArrowLeft className="size-4" />
          Back to {hotel.name}
        </Link>
      </Button>

      <h1 className="text-3xl font-semibold tracking-tight">Book your stay</h1>
      <p className="mt-1 text-muted-foreground">{hotel.name}</p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 min-w-28 items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold",
                i < step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i === step
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-2 h-px flex-1 bg-border" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {step === 0 && (
            <>
              <div className="glass-data rounded-xl border p-5">
                <h2 className="font-semibold">Select your dates</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  The bar under each date shows availability for your selected
                  room type.
                </p>
                <AvailabilityCalendar
                  data={calendarDays}
                  selected={dateRange}
                  onSelect={setDateRange}
                  disabled={(date) => date < addDays(new Date(), 1)}
                  onMonthChange={setCalendarMonth}
                />
              </div>
              <div className="glass-data rounded-xl border p-5">
                <h2 className="mb-4 font-semibold">Select your room</h2>
                <div className="space-y-3">
                  {roomOptions.map((room) => (
                    <RoomOptionCard
                      key={room.roomTypeId}
                      room={room}
                      selected={roomTypeId === room.roomTypeId}
                      onSelect={() => setRoomTypeId(room.roomTypeId)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="glass-data space-y-5 rounded-xl border p-5">
              <h2 className="font-semibold">Contact information</h2>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="contact-name">Full name</FieldLabel>
                  <Input
                    id="contact-name"
                    value={contact.name}
                    onChange={(e) =>
                      setContact((c) => ({ ...c, name: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) =>
                      setContact((c) => ({ ...c, email: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={contact.phone}
                    onChange={(e) =>
                      setContact((c) => ({ ...c, phone: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Guests</FieldLabel>
                  <Select
                    value={String(guests)}
                    onValueChange={(v) => setGuests(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {n === 1 ? "guest" : "guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="glass-data space-y-5 rounded-xl border p-5">
                <h2 className="font-semibold">Payment details</h2>
                <Field>
                  <FieldLabel>Payment method</FieldLabel>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit / debit card</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank transfer
                      </SelectItem>
                      <SelectItem value="cash">Pay at hotel</SelectItem>
                    </SelectContent>
                  </Select>
                  {!paymentMethod && (
                    <FieldError>Select a payment method to continue</FieldError>
                  )}
                </Field>
                <PaymentTrustBadges />
              </div>
              {showAuth && !user && (
                <InlineAuthPanel
                  defaultName={contact.name}
                  defaultEmail={contact.email}
                  onSuccess={() => {
                    setShowAuth(false);
                    submitBooking();
                  }}
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed}
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={handlePaymentContinue}
                disabled={!canProceed || createBooking.isPending}
              >
                {createBooking.isPending ? "Confirming…" : "Confirm booking"}
                {!createBooking.isPending && <Check className="size-4" />}
              </Button>
            )}
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
          <BookingSummaryPanel
            summary={{
              hotelName: hotel.name,
              roomTypeName:
                selectedAvailability?.name ??
                hotel.roomTypes.find((r) => r.id === roomTypeId)?.name,
              checkIn: checkIn || undefined,
              checkOut: checkOut || undefined,
              guests,
              nights: nights || undefined,
              pricePerNight: selectedAvailability
                ? Number(selectedAvailability.basePricePerNight)
                : undefined,
              total: selectedAvailability?.totalPrice,
            }}
          />
          <Progress
            value={((step + 1) / STEPS.length) * 100}
            className="mt-4 h-1.5"
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tabular-nums">
              {mobilePriceLabel}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {nights > 0
                ? `${nights} night${nights === 1 ? "" : "s"} · Step ${step + 1}/${STEPS.length}`
                : `Step ${step + 1} of ${STEPS.length}`}
            </p>
          </div>
          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handlePaymentContinue}
              disabled={!canProceed || createBooking.isPending}
            >
              {createBooking.isPending ? "Confirming…" : "Confirm"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
