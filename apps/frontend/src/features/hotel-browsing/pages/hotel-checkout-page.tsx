import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { meQueryOptions } from "~/features/auth/queries";
import type { CompleteBookingDraft } from "../booking-draft";
import { BookingSteps } from "../components/booking-steps";
import { BookingSummaryPanel } from "../components/booking-summary-panel";
import { PaymentTrustBadges } from "../components/payment-trust-badges";
import { gbp, hotelImage, roomCoverImage } from "../constants";
import {
  createHotelBookingMutationOptions,
  hotelAvailabilityQueryOptions,
  myHotelBookingsQueryOptions,
  publicHotelQueryOptions,
} from "../queries";

const PAYMENT_METHODS = [
  { value: "card", label: "Credit / debit card" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Pay at the hotel" },
] as const;

export function HotelCheckoutPage({
  hotelId,
  draft,
}: {
  hotelId: number;
  draft: CompleteBookingDraft;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: hotel } = useSuspenseQuery(publicHotelQueryOptions(hotelId));
  const { data: user } = useQuery(meQueryOptions);
  const [paymentMethod, setPaymentMethod] = useState("");

  const { data: availability = [], isPending: pricing } = useQuery(
    hotelAvailabilityQueryOptions(hotelId, draft.checkIn, draft.checkOut),
  );
  const selected = availability.find((a) => a.roomTypeId === draft.roomTypeId);
  const soldOut = selected != null && selected.availableRooms <= 0;
  const roomType = hotel.roomTypes.find((r) => r.id === draft.roomTypeId);
  // Availability rows carry photos, but fall back to the hotel's room record
  // before the hotel hero — the summary should show what's being booked.
  const coverImage =
    roomCoverImage(selected) ??
    roomCoverImage(roomType) ??
    hotel.images[0] ??
    hotelImage(hotel);

  const createBooking = useMutation({
    ...createHotelBookingMutationOptions(),
    onSuccess: async (booking) => {
      await queryClient.invalidateQueries({
        queryKey: myHotelBookingsQueryOptions.queryKey,
      });
      toast.success("Booking confirmed");
      void navigate({
        to: "/hotels/$hotelId/confirmation",
        params: { hotelId: String(hotelId) },
        search: { ref: booking.bookingReference },
      });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Booking failed"),
  });

  const canConfirm =
    Boolean(paymentMethod) && !soldOut && !pricing && !createBooking.isPending;

  const confirm = () =>
    createBooking.mutate({
      hotelId,
      roomTypeId: draft.roomTypeId,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      guests: draft.guests,
    });

  const backToBook = {
    to: "/hotels/$hotelId/book",
    params: { hotelId: String(hotelId) },
    search: draft,
  } as const;

  return (
    <div className="min-h-svh">
      {/* Checkout chrome: the site nav is suppressed here (see the route's
          staticData) because every link in it is an exit from the funnel. */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            FUNISLAND
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            Secure checkout
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6 lg:pb-12">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link {...backToBook}>
            <ArrowLeft className="size-4" />
            Back to dates and room
          </Link>
        </Button>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Review and pay</h1>
          <div className="w-full max-w-sm">
            <BookingSteps current={1} />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Who's staying</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Name</dt>
                  <dd className="mt-0.5 font-medium">{user?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 font-medium break-all">
                    {user?.email ?? "—"}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">
                Taken from your account. Your confirmation goes to this address.
              </p>
            </section>

            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Payment</h2>
              <Field className="mt-4">
                <FieldLabel htmlFor="payment-method">Payment method</FieldLabel>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Choose how you'd like to pay" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!paymentMethod && (
                  <FieldError>
                    Choose a payment method to confirm your booking
                  </FieldError>
                )}
              </Field>
              <div className="mt-5 border-t pt-5">
                <PaymentTrustBadges />
              </div>
            </section>

            {soldOut && (
              <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm">
                Those dates just sold out for this room.{" "}
                <Link {...backToBook} className="font-medium underline">
                  Pick different dates or another room
                </Link>
                .
              </p>
            )}

            <div className="hidden lg:block">
              <Button
                size="lg"
                className="w-full"
                disabled={!canConfirm}
                onClick={confirm}
              >
                {createBooking.isPending ? (
                  "Confirming…"
                ) : (
                  <>
                    Confirm booking
                    <Check className="size-4" />
                  </>
                )}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Free cancellation up to 48 hours before check-in
              </p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <BookingSummaryPanel
              summary={{
                hotelName: hotel.name,
                image: coverImage,
                roomTypeName: selected?.name ?? roomType?.name,
                checkIn: draft.checkIn,
                checkOut: draft.checkOut,
                guests: draft.guests,
                nights: selected?.nights,
                pricePerNight: selected
                  ? Number(selected.basePricePerNight)
                  : undefined,
                total: selected?.totalPrice,
              }}
            />
            <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
              <Link {...backToBook}>Change dates or room</Link>
            </Button>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tabular-nums">
              {selected ? gbp(selected.totalPrice) : "Pricing…"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {draft.guests} guest{draft.guests === 1 ? "" : "s"} · Step 2 of 2
            </p>
          </div>
          <Button disabled={!canConfirm} onClick={confirm}>
            {createBooking.isPending ? "Confirming…" : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
