import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { gbp, toDateKey } from "../constants";
import { gateSaleServerFn } from "../server";
import type { ParkTicket, ParkTicketType } from "../types";

const gateSaleSchema = z.object({
  ticketTypeId: z.number({ error: "Pick a ticket type" }).int().positive(),
  visitDate: z.string().min(1, "Visit date is required"),
  quantity: z
    .number({ error: "Enter a number" })
    .int("Must be a whole number")
    .min(1, "At least 1 ticket")
    .max(50, "At most 50 tickets"),
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.string().trim().email("Enter a valid email").max(255),
});
type GateSaleValues = z.infer<typeof gateSaleSchema>;

/**
 * Walk-up sale at the gate. The customer may have no account — the API
 * finds-or-creates a visitor from the name/email, and never attaches the
 * ticket to the staff member ringing it up.
 */
export function GateSaleDialog({
  open,
  onOpenChange,
  ticketTypes,
  onSold,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketTypes: ParkTicketType[];
  onSold: (ticket: ParkTicket) => void;
}) {
  const queryClient = useQueryClient();
  const today = toDateKey(new Date());

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<GateSaleValues>({
    resolver: zodResolver(gateSaleSchema),
    defaultValues: {
      ticketTypeId: ticketTypes[0]?.id,
      visitDate: today,
      quantity: 1,
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      ticketTypeId: ticketTypes[0]?.id,
      visitDate: today,
      quantity: 1,
      name: "",
      email: "",
    });
  }, [open, ticketTypes, today, reset]);

  const selectedTypeId = watch("ticketTypeId");
  const quantity = watch("quantity");
  const selectedType = ticketTypes.find((t) => t.id === Number(selectedTypeId));
  const total =
    selectedType && quantity > 0 ? Number(selectedType.price) * quantity : 0;

  const mutation = useMutation({
    mutationFn: (values: GateSaleValues) =>
      gateSaleServerFn({ data: values }),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["park-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["park-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["park-days"] });
      toast.success(`Sold ${ticket.ticketReference}`);
      onSold(ticket);
      onOpenChange(false);
    },
    // Surfaces the API's reason: day closed, or sold out.
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to sell ticket"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Walk-up sale</DialogTitle>
          <DialogDescription>
            Sell a ticket at the gate. Takes cash.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="gs-type">Ticket type</FieldLabel>
                <Controller
                  control={control}
                  name="ticketTypeId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger id="gs-type">
                        <SelectValue placeholder="Pick one" />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketTypes.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name} · {gbp(Number(t.price))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.ticketTypeId?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="gs-qty">Tickets</FieldLabel>
                <Input
                  id="gs-qty"
                  type="number"
                  min={1}
                  max={50}
                  {...register("quantity", { valueAsNumber: true })}
                />
                <FieldError>{errors.quantity?.message}</FieldError>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="gs-date">Visit date</FieldLabel>
              <Input id="gs-date" type="date" min={today} {...register("visitDate")} />
              <FieldError>{errors.visitDate?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="gs-name">Customer name</FieldLabel>
              <Input id="gs-name" {...register("name")} />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="gs-email">Customer email</FieldLabel>
              <Input id="gs-email" type="email" {...register("email")} />
              <FieldError>{errors.email?.message}</FieldError>
              <p className="text-muted-foreground text-xs">
                We'll reuse their account if this email already has one.
              </p>
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">Total to collect</span>
            <span className="text-xl font-semibold tabular-nums">
              {gbp(total)}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Selling…" : "Take payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
