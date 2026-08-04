import {
  BanknoteIcon,
  ChevronDownIcon,
  CreditCardIcon,
  LandmarkIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { gbp } from "../constants";
import type {
  BookingSource,
  ManualBookingStatus,
  PaymentMethod,
} from "../types";

const METHODS: {
  value: PaymentMethod;
  label: string;
  icon: typeof BanknoteIcon;
}[] = [
  { value: "cash", label: "Cash", icon: BanknoteIcon },
  { value: "card", label: "Card", icon: CreditCardIcon },
  { value: "bank_transfer", label: "Transfer", icon: LandmarkIcon },
];

export const SOURCE_LABELS: Record<BookingSource, string> = {
  walk_in: "Walk-in",
  phone: "Phone",
  email: "Email",
  corporate: "Corporate",
  ota: "Travel site",
};

/**
 * Settling up. Taking payment now reveals how it was taken — that's what goes
 * on the payment record — while "pay later" leaves the amount outstanding.
 */
export function PaymentFields({
  status,
  onStatusChange,
  method,
  onMethodChange,
  total,
}: {
  status: ManualBookingStatus;
  onStatusChange: (status: ManualBookingStatus) => void;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "rounded-xl border transition-colors",
          status === "confirmed"
            ? "border-brand bg-brand/5 ring-brand ring-1"
            : "bg-card",
        )}
      >
        <label className="flex cursor-pointer items-start gap-3 p-3">
          <input
            checked={status === "confirmed"}
            className="accent-brand mt-0.5 size-4"
            name="nb-payment"
            onChange={() => onStatusChange("confirmed")}
            type="radio"
          />
          <span className="flex-1">
            <span className="block text-sm font-medium">
              Collect payment now
            </span>
            <span className="text-muted-foreground block text-xs">
              Records {gbp(total)} against the booking.
            </span>
          </span>
        </label>

        {status === "confirmed" && (
          <div className="border-brand/30 flex flex-wrap gap-2 border-t px-3 py-2.5">
            {METHODS.map(({ value, label, icon: Icon }) => (
              <button
                aria-pressed={method === value}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
                  method === value
                    ? "border-brand bg-brand text-brand-foreground font-medium"
                    : "bg-card hover:bg-accent/50",
                )}
                key={value}
                onClick={() => onMethodChange(value)}
                type="button"
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          "rounded-xl border transition-colors",
          status === "pending"
            ? "border-brand bg-brand/5 ring-brand ring-1"
            : "bg-card",
        )}
      >
        <label className="flex cursor-pointer items-start gap-3 p-3">
          <input
            checked={status === "pending"}
            className="accent-brand mt-0.5 size-4"
            name="nb-payment"
            onChange={() => onStatusChange("pending")}
            type="radio"
          />
          <span className="flex-1">
            <span className="block text-sm font-medium">Pay later</span>
            <span className="text-muted-foreground block text-xs">
              {gbp(total)} stays outstanding. Confirm the booking once they pay.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

export interface BookingDetailFields {
  source: BookingSource;
  arrivalTime: string;
  specialRequests: string;
  internalNotes: string;
}

/**
 * Context the desk sometimes has and sometimes doesn't. Collapsed by default
 * so the common path stays four decisions long.
 */
export function BookingDetails({
  open,
  onOpenChange,
  fields,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: BookingDetailFields;
  onChange: (fields: BookingDetailFields) => void;
}) {
  const set = (patch: Partial<BookingDetailFields>) =>
    onChange({ ...fields, ...patch });

  const filled = [
    fields.arrivalTime,
    fields.specialRequests,
    fields.internalNotes,
  ].filter(Boolean).length;

  return (
    <Collapsible onOpenChange={onOpenChange} open={open}>
      <CollapsibleTrigger
        className={cn(
          "text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm",
          "focus-visible:ring-ring/50 rounded focus-visible:ring-[3px] focus-visible:outline-none",
        )}
      >
        <ChevronDownIcon
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
        More details
        {!open && filled > 0 && (
          <span className="text-xs">
            ({filled} {filled === 1 ? "field" : "fields"})
          </span>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="bg-card mt-3 grid grid-cols-1 gap-4 rounded-xl border p-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="nb-source">Booking source</FieldLabel>
            <Select
              onValueChange={(v) => set({ source: v as BookingSource })}
              value={fields.source}
            >
              <SelectTrigger className="w-full" id="nb-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SOURCE_LABELS) as BookingSource[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {SOURCE_LABELS[value]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="nb-arrival">Expected arrival</FieldLabel>
            <Input
              id="nb-arrival"
              onChange={(e) => set({ arrivalTime: e.target.value })}
              type="time"
              value={fields.arrivalTime}
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="nb-requests">Special requests</FieldLabel>
            <Textarea
              id="nb-requests"
              onChange={(e) => set({ specialRequests: e.target.value })}
              placeholder="Late check-in, cot, high floor…"
              rows={2}
              value={fields.specialRequests}
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="nb-notes">Internal notes</FieldLabel>
            <Textarea
              id="nb-notes"
              onChange={(e) => set({ internalNotes: e.target.value })}
              placeholder="Only staff see this."
              rows={2}
              value={fields.internalNotes}
            />
          </Field>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
