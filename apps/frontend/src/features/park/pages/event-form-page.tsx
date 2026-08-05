import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  ImageIcon,
  InfoIcon,
  PoundSterlingIcon,
} from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { PhotoDropzone } from "~/features/hotels/components/photo-dropzone";
import { StagedPhotoGrid } from "~/features/hotels/components/staged-photo-grid";
import { useStagedPhotos } from "~/features/hotels/hooks/use-staged-photos";
import { setEventCoverImage, uploadEventImage } from "~/features/hotels/images-api";
import { EventMedia } from "../components/event-media";
import { EventSchedulesPanel } from "../components/event-schedules-panel";
import { EventTypeBadge } from "../components/park-badges";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  LOCATION_TYPES,
  LOCATION_TYPE_LABELS,
  gbp,
} from "../constants";
import { parkEventQueryOptions } from "../queries";
import { createParkEventServerFn, updateParkEventServerFn } from "../server";
import type { ParkEventDetail } from "../types";

const DECIMAL = /^\d+(\.\d{1,2})?$/;

const eventSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  description: z.string().trim().min(1, "Description is required"),
  eventType: z.enum(["ride", "show", "beach_event"]),
  locationType: z.enum(["theme_park", "beach"]),
  basePrice: z
    .string()
    .trim()
    .regex(DECIMAL, "Enter a decimal amount like 12.50"),
  isActive: z.boolean(),
});
type EventValues = z.infer<typeof eventSchema>;

export function NewEventPage() {
  return <EventForm />;
}

export function EditEventPage({ eventId }: { eventId: number }) {
  const { data: event, isPending } = useQuery(parkEventQueryOptions(eventId));

  if (isPending) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (!event) {
    return <p className="text-destructive text-sm">Event not found.</p>;
  }
  return <EventForm event={event} />;
}

function EventForm({ event }: { event?: ParkEventDetail }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEdit = event != null;
  // Photos picked before the event exists; uploaded once it does.
  const staged = useStagedPhotos();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      eventType: "ride",
      locationType: "theme_park",
      basePrice: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!event) return;
    reset({
      name: event.name,
      description: event.description,
      eventType: event.eventType,
      locationType: event.locationType,
      basePrice: event.basePrice,
      isActive: event.isActive,
    });
  }, [event, reset]);

  const mutation = useMutation({
    mutationFn: async (values: EventValues) => {
      if (isEdit) {
        const updated = await updateParkEventServerFn({
          data: { id: event.id, ...values },
        });
        return { saved: updated, failedPhotos: 0 };
      }

      const saved = await createParkEventServerFn({ data: values });

      // The event exists now, so photos can finally be attached. Each is
      // uploaded on its own — one bad file shouldn't lose the others.
      let coverImageId: number | null = null;
      let failedPhotos = 0;
      for (const photo of staged.photos) {
        try {
          const uploaded = await uploadEventImage(saved.id, photo.file);
          if (photo.key === staged.coverKey) coverImageId = uploaded.id;
        } catch {
          failedPhotos += 1;
        }
      }
      // The first upload is cover by default; only correct it if asked.
      if (coverImageId !== null && staged.photos[0]?.key !== staged.coverKey) {
        try {
          await setEventCoverImage(saved.id, coverImageId);
        } catch {
          /* cover is cosmetic — never fail the save over it */
        }
      }

      return { saved, failedPhotos };
    },
    onSuccess: ({ saved, failedPhotos }) => {
      queryClient.invalidateQueries({ queryKey: ["park-events"] });
      queryClient.invalidateQueries({
        queryKey: parkEventQueryOptions(saved.id).queryKey,
      });

      if (isEdit) {
        toast.success("Event updated");
        void navigate({ to: "/dashboard/park/events" });
        return;
      }

      staged.clear();
      if (failedPhotos > 0) {
        // Land on the event so the missing photos can be retried.
        toast.error(
          `${saved.name} was created, but ${failedPhotos} ${failedPhotos === 1 ? "photo" : "photos"} failed to upload`,
        );
        void navigate({
          to: "/dashboard/park/events/$eventId",
          params: { eventId: String(saved.id) },
        });
        return;
      }

      toast.success("Event created");
      void navigate({ to: "/dashboard/park/events" });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  const price = watch("basePrice");
  const eventType = watch("eventType");

  return (
    <div className="flex flex-col gap-6">
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
              className="text-muted-foreground -ml-2 w-fit"
            >
              <Link to="/dashboard/park/events">
                <ArrowLeftIcon data-icon="inline-start" />
                Back to events
              </Link>
            </Button>
            {/* Written out rather than a <PageHeading />: the title is the
                event's own name, which only exists once the data has loaded. */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {isEdit ? event.name : "New event"}
              </h1>
              {isEdit && <EventTypeBadge type={event.eventType} />}
            </div>
            <p className="text-muted-foreground max-w-2xl text-sm">
              {isEdit
                ? "Update this event's details, photos and the times it runs."
                : "Add a ride, show or beach event. You can add photos now and the times it runs once it's saved."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" type="button">
              <Link to="/dashboard/park/events">Cancel</Link>
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? staged.photos.length > 0 && !isEdit
                  ? "Saving & uploading…"
                  : "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create event"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <InfoIcon className="text-muted-foreground size-4" />
                  Basic information
                </CardTitle>
                <CardDescription>
                  What visitors see when they browse the park.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="ev-name">Name</FieldLabel>
                    <Input id="ev-name" {...register("name")} />
                    <FieldError>{errors.name?.message}</FieldError>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ev-description">
                      Description
                    </FieldLabel>
                    <Textarea
                      id="ev-description"
                      rows={5}
                      {...register("description")}
                    />
                    <FieldError>{errors.description?.message}</FieldError>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="ev-type">Type</FieldLabel>
                      <Controller
                        control={control}
                        name="eventType"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger id="ev-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EVENT_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {EVENT_TYPE_LABELS[t]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FieldError>{errors.eventType?.message}</FieldError>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="ev-location">Location</FieldLabel>
                      <Controller
                        control={control}
                        name="locationType"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger id="ev-location">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LOCATION_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {LOCATION_TYPE_LABELS[t]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FieldError>{errors.locationType?.message}</FieldError>
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PoundSterlingIcon className="text-muted-foreground size-4" />
                  Pricing and status
                </CardTitle>
                <CardDescription>
                  Changing the price never affects seats already booked.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="ev-price">Base price (£)</FieldLabel>
                    <Input
                      id="ev-price"
                      placeholder="12.50"
                      {...register("basePrice")}
                    />
                    <FieldError>{errors.basePrice?.message}</FieldError>
                    {DECIMAL.test(price?.trim() ?? "") && (
                      <p className="text-muted-foreground text-xs">
                        {gbp(Number(price))} per seat on every{" "}
                        {EVENT_TYPE_LABELS[eventType].toLowerCase()} booking.
                      </p>
                    )}
                  </Field>
                  <Controller
                    control={control}
                    name="isActive"
                    render={({ field }) => (
                      <Field orientation="horizontal">
                        <Switch
                          id="ev-active"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FieldLabel htmlFor="ev-active">
                          Active — visitors can book this event
                        </FieldLabel>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="text-muted-foreground size-4" />
                Photos
              </CardTitle>
              <CardDescription>
                {isEdit
                  ? "The cover photo represents this event across the site."
                  : "Pick photos now — they upload as soon as the event is created."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEdit ? (
                <EventMedia eventId={event.id} />
              ) : (
                <div className="flex flex-col gap-3">
                  <PhotoDropzone
                    onFiles={staged.add}
                    busy={mutation.isPending}
                  />
                  {staged.photos.length > 0 && (
                    <StagedPhotoGrid
                      photos={staged.photos}
                      coverKey={staged.coverKey}
                      disabled={mutation.isPending}
                      onRemove={staged.remove}
                      onSetCover={staged.setCoverKey}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Outside the form: schedules save themselves, and nesting their own
          submit buttons inside this form would fire the event save instead. */}
      {isEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClockIcon className="text-muted-foreground size-4" />
              Schedules
            </CardTitle>
            <CardDescription>
              When {event.name} runs, and how full each time is.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventSchedulesPanel eventId={event.id} eventName={event.name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
