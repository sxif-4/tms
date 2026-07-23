import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { parkTicketTypesQueryOptions } from "../queries";
import {
  createParkTicketTypeServerFn,
  updateParkTicketTypeServerFn,
} from "../server";
import type { ParkTicketType } from "../types";

const DECIMAL = /^\d+(\.\d{1,2})?$/;

const ticketTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  price: z.string().trim().regex(DECIMAL, "Enter a decimal amount like 45.00"),
});
type TicketTypeValues = z.infer<typeof ticketTypeSchema>;

export function TicketTypeDialog({
  open,
  onOpenChange,
  ticketType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketType: ParkTicketType | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = ticketType != null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketTypeValues>({
    resolver: zodResolver(ticketTypeSchema),
    defaultValues: { name: "", price: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ name: ticketType?.name ?? "", price: ticketType?.price ?? "" });
  }, [open, ticketType, reset]);

  const mutation = useMutation({
    mutationFn: (values: TicketTypeValues) =>
      isEdit
        ? updateParkTicketTypeServerFn({
            data: { id: ticketType.id, ...values },
          })
        : createParkTicketTypeServerFn({ data: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: parkTicketTypesQueryOptions.queryKey,
      });
      toast.success(isEdit ? "Ticket type updated" : "Ticket type created");
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit ticket type" : "New ticket type"}
          </DialogTitle>
          <DialogDescription>
            The priced tiers visitors buy from.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="tt-name">Name</FieldLabel>
              <Input id="tt-name" placeholder="Day Pass" {...register("name")} />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="tt-price">Price (£)</FieldLabel>
              <Input id="tt-price" placeholder="45.00" {...register("price")} />
              <FieldError>{errors.price?.message}</FieldError>
              {isEdit && (
                <p className="text-muted-foreground text-xs">
                  Tickets already sold keep the price they were bought at.
                </p>
              )}
            </Field>
          </FieldGroup>
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
              {mutation.isPending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
