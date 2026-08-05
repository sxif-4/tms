import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import { addDays, format, startOfMonth } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";
import type { BookingDraft } from "../booking-draft";
import { draftToDateRange, toCalendarDay } from "../booking-draft";
import { AvailabilityCalendar } from "../components/availability-calendar";
import { BookingSteps } from "../components/booking-steps";
import { BookingSummaryPanel } from "../components/booking-summary-panel";
import { RoomOptionCard } from "../components/room-option-card";
import { gbp, hotelImage, roomCoverImage } from "../constants";
import {
  availabilityCalendarQueryOptions,
  hotelAvailabilityQueryOptions,
  publicHotelQueryOptions,
} from "../queries";

const route = getRouteApi("/hotels/$hotelId/book");

const DEFAULT_GUESTS = 2;
const CALENDAR_WINDOW_DAYS = 60;

export function HotelBookPage({ hotelId }: { hotelId: number }) {
  const draft = route.useSearch();
  const navigate = route.useNavigate();
  const { data: hotel } = useSuspenseQuery(publicHotelQueryOptions(hotelId));
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );

  /*
   * Soft defaults: presented as chosen, but only written to the URL once the
   * guest actually picks, so the address bar carries decisions and not guesses.
   */
  const roomTypeId = draft.roomTypeId ?? hotel.roomTypes[0]?.id ?? null;
  const selectedRoomType = hotel.roomTypes.find((r) => r.id === roomTypeId);
  const maxGuests = selectedRoomType?.maxOccupancy ?? 10;
  const guests = Math.min(draft.guests ?? DEFAULT_GUESTS, maxGuests);

  const updateDraft = (patch: Partial<BookingDraft>) =>
    void navigate({
      search: (prev) => ({ ...prev, ...patch }),
      // Each calendar click shouldn't become its own back-button stop.
      replace: true,
      // Editing the draft is a navigation now that it lives in the URL, and the
      // router scrolls to top on every one. Nobody picking a room expects the
      // page to jump out from under them.
      resetScroll: false,
    });

  const calendarFrom = format(calendarMonth, "yyyy-MM-dd");
  const calendarTo = format(
    addDays(calendarMonth, CALENDAR_WINDOW_DAYS),
    "yyyy-MM-dd",
  );

  const { data: calendarDays = [] } = useQuery(
    availabilityCalendarQueryOptions(
      hotelId,
      calendarFrom,
      calendarTo,
      roomTypeId ?? undefined,
    ),
  );

  const { data: availability = [] } = useQuery(
    hotelAvailabilityQueryOptions(
      hotelId,
      draft.checkIn ?? "",
      draft.checkOut ?? "",
    ),
  );

  const selectedAvailability = availability.find(
    (a) => a.roomTypeId === roomTypeId,
  );
  const nights = selectedAvailability?.nights ?? 0;

  const handleSelectRange = (range: DateRange | undefined) =>
    updateDraft({
      checkIn: range?.from ? toCalendarDay(range.from) : undefined,
      checkOut: range?.to ? toCalendarDay(range.to) : undefined,
    });

  const canContinue = Boolean(
    draft.checkIn &&
    draft.checkOut &&
    roomTypeId &&
    selectedAvailability &&
    selectedAvailability.availableRooms > 0,
  );

  const continueToCheckout = () => {
    if (!roomTypeId || !draft.checkIn || !draft.checkOut) return;
    void navigate({
      to: "/hotels/$hotelId/checkout",
      params: { hotelId: String(hotelId) },
      search: {
        roomTypeId,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        guests,
      },
    });
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

  const selectedRoomOption = roomOptions.find(
    (r) => r.roomTypeId === roomTypeId,
  );

  const mobilePriceLabel =
    selectedAvailability && nights > 0
      ? `${gbp(selectedAvailability.totalPrice)} total`
      : selectedAvailability
        ? `${gbp(Number(selectedAvailability.basePricePerNight))}/night`
        : "Select dates";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-12">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/hotels/$hotelId" params={{ hotelId: String(hotelId) }}>
          <ArrowLeft className="size-4" />
          Back to {hotel.name}
        </Link>
      </Button>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Choose your dates and room
          </h1>
          <p className="mt-1 text-muted-foreground">{hotel.name}</p>
        </div>
        <div className="w-full max-w-sm">
          <BookingSteps current={0} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Select your dates</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              The bar under each date shows availability for your selected room
              type.
            </p>
            <AvailabilityCalendar
              data={calendarDays}
              selected={draftToDateRange(draft)}
              onSelect={handleSelectRange}
              disabled={(date) => date < addDays(new Date(), 1)}
              onMonthChange={setCalendarMonth}
            />
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Select your room</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {draft.checkIn && draft.checkOut
                ? "Prices shown are for your selected dates."
                : "Pick your dates to see live availability and totals."}
            </p>
            <div className="space-y-3" role="radiogroup" aria-label="Room type">
              {roomOptions.map((room) => (
                <RoomOptionCard
                  key={room.roomTypeId}
                  room={room}
                  selected={roomTypeId === room.roomTypeId}
                  onSelect={() => updateDraft({ roomTypeId: room.roomTypeId })}
                />
              ))}
            </div>
          </section>

          <div className="hidden justify-end lg:flex">
            <Button
              size="lg"
              disabled={!canContinue}
              onClick={continueToCheckout}
            >
              Continue to checkout
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <BookingSummaryPanel
            summary={{
              hotelName: hotel.name,
              image:
                roomCoverImage(selectedRoomOption) ??
                hotel.images[0] ??
                hotelImage(hotel),
              roomTypeName:
                selectedAvailability?.name ?? selectedRoomType?.name,
              checkIn: draft.checkIn,
              checkOut: draft.checkOut,
              guests,
              nights: nights || undefined,
              pricePerNight: selectedAvailability
                ? Number(selectedAvailability.basePricePerNight)
                : undefined,
              total: selectedAvailability?.totalPrice,
            }}
            onGuestsChange={(value) => updateDraft({ guests: value })}
            maxGuests={maxGuests}
          />
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
                ? `${nights} night${nights === 1 ? "" : "s"} · ${guests} guest${guests === 1 ? "" : "s"}`
                : "Step 1 of 2"}
            </p>
          </div>
          <Button disabled={!canContinue} onClick={continueToCheckout}>
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
