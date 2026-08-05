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
import { createFerryRouteServerFn, updateFerryRouteServerFn } from "../server";
import type { FerryRoute } from "../types";

const routeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  origin: z.string().trim().min(1, "Origin is required").max(100),
  destination: z.string().trim().min(1, "Destination is required").max(100),
});
type RouteValues = z.infer<typeof routeSchema>;

export function FerryRouteDialog({
  open,
  onOpenChange,
  route,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: FerryRoute | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = route != null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RouteValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: { name: "", origin: "", destination: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: route?.name ?? "",
      origin: route?.origin ?? "",
      destination: route?.destination ?? "",
    });
  }, [open, route, reset]);

  const mutation = useMutation({
    mutationFn: (values: RouteValues) =>
      isEdit
        ? updateFerryRouteServerFn({ data: { id: route.id, ...values } })
        : createFerryRouteServerFn({ data: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferry", "routes"] });
      toast.success(isEdit ? "Route updated" : "Route created");
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit route" : "New route"}</DialogTitle>
          <DialogDescription>
            A service between two points on the island network. Sailings are
            scheduled against it.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="route-name">Route name</FieldLabel>
              <Input
                id="route-name"
                placeholder="Hulhumalé ↔ Resort Island"
                {...register("name")}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="route-origin">Origin</FieldLabel>
                <Input
                  id="route-origin"
                  placeholder="Hulhumalé Jetty"
                  {...register("origin")}
                />
                <FieldError>{errors.origin?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="route-destination">Destination</FieldLabel>
                <Input
                  id="route-destination"
                  placeholder="Resort Island Dock"
                  {...register("destination")}
                />
                <FieldError>{errors.destination?.message}</FieldError>
              </Field>
            </div>
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
