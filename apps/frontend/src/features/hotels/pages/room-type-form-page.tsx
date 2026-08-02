import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ImageIcon,
  InfoIcon,
  PoundSterlingIcon,
  SparklesIcon,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { AmenityIcon } from "~/lib/amenity-icon";
import { gbp } from "../constants";
import { useCurrentHotel } from "../hooks/use-current-hotel";
import { roomTypeQueryOptions, roomTypesQueryOptions } from "../queries";
import { createRoomTypeServerFn, updateRoomTypeServerFn } from "../server";
import type { RoomType } from "../types";
import { groupAmenities } from "../utils";

const DECIMAL = /^\d+(\.\d{1,2})?$/;

const roomTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  description: z.string().trim().min(1, "Description is required"),
  basePricePerNight: z
    .string()
    .trim()
    .regex(DECIMAL, "Enter a decimal amount like 120.00"),
  maxOccupancy: z
    .number({ error: "Enter a number" })
    .int("Must be a whole number")
    .min(1, "At least 1 guest")
    .max(20, "At most 20 guests"),
});
type RoomTypeValues = z.infer<typeof roomTypeSchema>;

/** Create mode: needs the current hotel from context. */
export function NewRoomTypePage() {
  const { hotel, hotelId } = useCurrentHotel();

  if (!hotel || hotelId == null) {
    return (
      <p className="text-sm text-muted-foreground">
        Your account isn't assigned to a hotel yet.
      </p>
    );
  }
  return <RoomTypeForm hotelId={hotelId} hotelName={hotel.name} />;
}

/** Edit mode: the room type carries its own hotel, so the id in the URL is enough. */
export function EditRoomTypePage({ roomTypeId }: { roomTypeId: number }) {
  const { data: roomType, isPending } = useQuery(
    roomTypeQueryOptions(roomTypeId),
  );

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!roomType) {
    return <p className="text-sm text-destructive">Room type not found.</p>;
  }
  return <RoomTypeForm hotelId={roomType.hotelId} roomType={roomType} />;
}

function RoomTypeForm({
  hotelId,
  hotelName,
  roomType,
}: {
  hotelId: number;
  hotelName?: string;
  roomType?: RoomType;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEdit = roomType != null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<RoomTypeValues>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      basePricePerNight: "",
      maxOccupancy: 2,
    },
  });

  useEffect(() => {
    if (!roomType) return;
    reset({
      name: roomType.name,
      description: roomType.description,
      basePricePerNight: roomType.basePricePerNight,
      maxOccupancy: roomType.maxOccupancy,
    });
  }, [roomType, reset]);

  const mutation = useMutation({
    mutationFn: (values: RoomTypeValues) =>
      isEdit
        ? updateRoomTypeServerFn({ data: { id: roomType.id, ...values } })
        : createRoomTypeServerFn({ data: { hotelId, ...values } }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({
        queryKey: roomTypesQueryOptions(hotelId).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: roomTypeQueryOptions(saved.id).queryKey,
      });
      toast.success(isEdit ? "Room type updated" : "Room type created");
      void navigate({ to: "/dashboard/hotel/rooms" });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  const price = watch("basePricePerNight");
  const amenityGroups = groupAmenities(roomType?.amenities);
  const images = roomType?.images ?? [];

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit text-muted-foreground"
          >
            <Link to="/dashboard/hotel/rooms">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to rooms
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-semibold">
            {isEdit ? roomType.name : "New room type"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update this room type's details and pricing."
              : `Add a room type to ${hotelName ?? "this hotel"}, then stock it with rooms.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" type="button">
            <Link to="/dashboard/hotel/rooms">Cancel</Link>
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create room type"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="size-4 text-muted-foreground" />
                Basic information
              </CardTitle>
              <CardDescription>
                How this room type appears to guests browsing the hotel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="rt-name">Room type name</FieldLabel>
                  <Input
                    id="rt-name"
                    placeholder="Premier Garden Suite"
                    {...register("name")}
                  />
                  <FieldError>{errors.name?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="rt-description">About</FieldLabel>
                  <Textarea
                    id="rt-description"
                    rows={6}
                    placeholder="A serene escape with elegant interiors, modern amenities, and direct access to the hotel's garden…"
                    {...register("description")}
                  />
                  <FieldError>{errors.description?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="rt-occupancy">Max guests</FieldLabel>
                  <Input
                    id="rt-occupancy"
                    type="number"
                    min={1}
                    max={20}
                    className="max-w-32"
                    {...register("maxOccupancy", { valueAsNumber: true })}
                  />
                  <FieldError>{errors.maxOccupancy?.message}</FieldError>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PoundSterlingIcon className="size-4 text-muted-foreground" />
                Pricing
              </CardTitle>
              <CardDescription>
                Charged per night. Bookings snapshot this price, so changing it
                never alters what past guests paid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="rt-price">Base price</FieldLabel>
                  <div className="flex items-center gap-3">
                    <Input
                      id="rt-price"
                      inputMode="decimal"
                      placeholder="280.00"
                      className="max-w-40"
                      {...register("basePricePerNight")}
                    />
                    <span className="text-sm text-muted-foreground">
                      per night
                    </span>
                  </div>
                  <FieldError>{errors.basePricePerNight?.message}</FieldError>
                  {DECIMAL.test(price?.trim() ?? "") && (
                    <p className="text-sm text-muted-foreground">
                      Guests will see {gbp(Number(price))} per night.
                    </p>
                  )}
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="size-4 text-muted-foreground" />
                Photos
              </CardTitle>
              <CardDescription>
                Shown in the gallery on the hotel's public page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((url) => (
                    <div
                      key={url}
                      className="aspect-square overflow-hidden rounded-lg bg-muted"
                    >
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
                  <ImageIcon className="size-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No photos for this room type
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Uploading isn't available yet — photos currently come from seed
                data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="size-4 text-muted-foreground" />
                Amenities
              </CardTitle>
              <CardDescription>
                What's included with this room type.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {amenityGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isEdit
                    ? "No amenities linked to this room type."
                    : "Amenities can't be set at creation time yet."}
                </p>
              ) : (
                amenityGroups.map((group) => (
                  <div key={group.category} className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">{group.label}</h3>
                    <ul className="flex flex-wrap gap-1.5">
                      {group.items.map((amenity) => (
                        <li
                          key={amenity.id}
                          className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs text-muted-foreground"
                        >
                          <AmenityIcon name={amenity.icon} />
                          {amenity.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
              <p className="text-xs text-muted-foreground">
                Amenities are managed through seed data and can't be edited here
                yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {isDirty && (
        <p className="text-xs text-muted-foreground">
          You have unsaved changes.
        </p>
      )}
    </form>
  );
}
