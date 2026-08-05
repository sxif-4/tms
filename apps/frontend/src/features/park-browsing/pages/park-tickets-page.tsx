import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { addDays, format, startOfMonth } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Minus,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { InlineAuthPanel } from "~/features/hotel-browsing/components/inline-auth-panel";
import { PaymentTrustBadges } from "~/features/hotel-browsing/components/payment-trust-badges";
import { cn } from "~/lib/utils";
import { ParkDatePicker } from "../components/park-date-picker";
import { TicketSummaryPanel } from "../components/ticket-summary-panel";
import { TicketTypeCard } from "../components/ticket-type-card";
import { gbp } from "../constants";
import {
  parkAvailabilityQueryOptions,
  publicTicketTypesQueryOptions,
  purchaseParkTicketMutationOptions,
} from "../queries";

const STEPS = ["Date & tickets", "Contact", "Payment"] as const;

/** The API caps a single purchase at 50 tickets (`CreateParkTicketDto`). */
const MAX_QUANTITY = 50;

/** How far past the visible month to prefetch availability. */
const CALENDAR_WINDOW_DAYS = 60;

export function ParkTicketsPage({ initialDate }: { initialDate?: string }) {
  const navigate = useNavigate();
  const { data: ticketTypes } = useSuspenseQuery(publicTicketTypesQueryOptions);
  const { data: user } = useQuery(meQueryOptions);

  const [step, setStep] = useState(0);
  const [visitDate, setVisitDate] = useState<Date | undefined>(() =>
    initialDate ? new Date(`${initialDate}T00:00:00`) : undefined,
  );
  const [ticketTypeId, setTicketTypeId] = useState<number | null>(
    ticketTypes[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(2);
  const [contact, setContact] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(visitDate ?? new Date()),
  );

  const calendarFrom = format(calendarMonth, "yyyy-MM-dd");
  const calendarTo = format(
    addDays(calendarMonth, CALENDAR_WINDOW_DAYS),
    "yyyy-MM-dd",
  );
  const { data: availability = [] } = useQuery(
    parkAvailabilityQueryOptions(calendarFrom, calendarTo),
  );

  const visitDateKey = visitDate ? format(visitDate, "yyyy-MM-dd") : "";
  const selectedDay = availability.find((d) => d.date === visitDateKey);
  const selectedType = ticketTypes.find((t) => t.id === ticketTypeId);
  const pricePerTicket = selectedType ? Number(selectedType.price) : undefined;

  /** Never offer more tickets than the day has left. */
  const maxQuantity = Math.max(
    1,
    Math.min(MAX_QUANTITY, selectedDay?.remaining ?? MAX_QUANTITY),
  );
  const overRemaining = selectedDay != null && quantity > selectedDay.remaining;

  const purchase = useMutation({
    ...purchaseParkTicketMutationOptions(),
    onSuccess: (ticket) => {
      toast.success("Tickets confirmed!");
      void navigate({
        to: "/theme-park/confirmation",
        search: { ref: ticket.ticketReference },
      });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Purchase failed"),
  });

  const contactValid =
    contact.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) &&
    contact.phone.trim().length >= 7;

  const canProceed = useMemo(() => {
    if (step === 0)
      return (
        Boolean(visitDateKey && ticketTypeId && quantity > 0) && !overRemaining
      );
    if (step === 1) return contactValid;
    if (step === 2) return paymentMethod.length > 0;
    return false;
  }, [
    step,
    visitDateKey,
    ticketTypeId,
    quantity,
    overRemaining,
    contactValid,
    paymentMethod,
  ]);

  const submitPurchase = () => {
    if (!ticketTypeId || !visitDateKey) return;
    purchase.mutate({ ticketTypeId, visitDate: visitDateKey, quantity });
  };

  /** Guests can browse and price a purchase; only paying needs an account. */
  const handleConfirm = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    submitPurchase();
  };

  const total = (pricePerTicket ?? 0) * quantity;
  const mobilePriceLabel =
    pricePerTicket != null ? `${gbp(total)} total` : "Select a ticket";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pb-28 sm:px-6 lg:px-8 lg:pb-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/theme-park">
          <ArrowLeft className="size-4" />
          Back to the theme park
        </Link>
      </Button>

      <h1 className="text-3xl font-semibold tracking-tight">
        Buy park tickets
      </h1>
      <p className="mt-1 text-muted-foreground">
        Park entry for your chosen day. Rides and shows are booked separately
        once you have a ticket.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 min-w-28 items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold",
                i < step
                  ? "border-brand bg-brand text-primary-foreground"
                  : i === step
                    ? "border-brand text-brand"
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
                <h2 className="font-semibold">Pick your visit date</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  The bar under each date shows how the day is selling. Closed
                  and sold-out days can&apos;t be selected.
                </p>
                <ParkDatePicker
                  data={availability}
                  selected={visitDate}
                  onSelect={setVisitDate}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                />
                {selectedDay && selectedDay.remaining <= 100 && (
                  <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="size-4 text-series-park" />
                    Only {selectedDay.remaining} ticket
                    {selectedDay.remaining === 1 ? "" : "s"} left for this day
                  </p>
                )}
              </div>

              <div className="glass-data rounded-xl border p-5">
                <h2 className="mb-4 font-semibold">Choose a ticket</h2>
                <div
                  role="radiogroup"
                  aria-label="Ticket type"
                  className="space-y-3"
                >
                  {ticketTypes.map((type) => (
                    <TicketTypeCard
                      key={type.id}
                      ticketType={type}
                      selected={ticketTypeId === type.id}
                      onSelect={() => setTicketTypeId(type.id)}
                    />
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t pt-5">
                  <div>
                    <p className="font-medium">Guests</p>
                    <p className="text-sm text-muted-foreground">
                      One ticket per person
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="One fewer ticket"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span
                      aria-live="polite"
                      className="w-8 text-center text-lg font-semibold tabular-nums"
                    >
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="One more ticket"
                      onClick={() =>
                        setQuantity((q) => Math.min(maxQuantity, q + 1))
                      }
                      disabled={quantity >= maxQuantity}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
                {overRemaining && (
                  <p className="mt-3 text-sm text-destructive">
                    Only {selectedDay?.remaining} left for that day — reduce the
                    guest count or pick another date.
                  </p>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <div className="glass-data space-y-5 rounded-xl border p-5">
              <h2 className="font-semibold">Contact information</h2>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="park-contact-name">Full name</FieldLabel>
                  <Input
                    id="park-contact-name"
                    value={contact.name}
                    onChange={(e) =>
                      setContact((c) => ({ ...c, name: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="park-contact-email">Email</FieldLabel>
                  <Input
                    id="park-contact-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) =>
                      setContact((c) => ({ ...c, email: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="park-contact-phone">Phone</FieldLabel>
                  <Input
                    id="park-contact-phone"
                    type="tel"
                    value={contact.phone}
                    onChange={(e) =>
                      setContact((c) => ({ ...c, phone: e.target.value }))
                    }
                  />
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
                    submitPurchase();
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
                onClick={handleConfirm}
                disabled={!canProceed || purchase.isPending}
              >
                {purchase.isPending ? "Confirming…" : "Confirm purchase"}
                {!purchase.isPending && <Check className="size-4" />}
              </Button>
            )}
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
          <TicketSummaryPanel
            summary={{
              ticketTypeName: selectedType?.name,
              visitDate: visitDateKey || undefined,
              quantity,
              pricePerTicket,
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
              {quantity} ticket{quantity === 1 ? "" : "s"} · Step {step + 1}/
              {STEPS.length}
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
              onClick={handleConfirm}
              disabled={!canProceed || purchase.isPending}
            >
              {purchase.isPending ? "Confirming…" : "Confirm"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
