import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { RoomOptionCard } from "../components/room-option-card";
import { gbp, hotelImage } from "../constants";
import { publicHotelQueryOptions } from "../queries";

export function HotelDetailPage({ hotelId }: { hotelId: number }) {
  const { data: hotel } = useSuspenseQuery(publicHotelQueryOptions(hotelId));
  const heroImage = hotel.images[0] ?? hotelImage(hotel);

  return (
    <div>
      <div className="relative h-[40vh] min-h-70 w-full overflow-hidden">
        <img
          src={heroImage}
          alt={hotel.name}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <Button asChild variant="ghost" size="sm" className="mb-3">
              <Link to="/hotels">
                <ArrowLeft className="size-4" />
                Back to hotels
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {hotel.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-4">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {hotel.description ?? "No description available yet."}
                </p>
              </TabsContent>

              <TabsContent value="rooms" className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {hotel.roomTypes.length === 0
                    ? "No room types have been configured for this hotel yet."
                    : `${hotel.roomTypes.length} room ${hotel.roomTypes.length === 1 ? "type" : "types"} available.`}
                </p>
                {hotel.roomTypes.map((roomType) => (
                  <RoomOptionCard
                    key={roomType.id}
                    room={{ ...roomType, roomTypeId: roomType.id }}
                  />
                ))}
              </TabsContent>

              <TabsContent value="policies" className="mt-6 space-y-4">
                <div className="glass-data rounded-xl border p-5">
                  <h3 className="font-semibold">Check-in & check-out</h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Check-in from
                      </dt>
                      <dd className="font-medium">3:00 PM</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Check-out by
                      </dt>
                      <dd className="font-medium">11:00 AM</dd>
                    </div>
                  </dl>
                </div>
                <div className="glass-data rounded-xl border p-5">
                  <h3 className="font-semibold">Cancellation policy</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Free cancellation up to 48 hours before check-in. Cancellations
                    made after that window may be subject to a one-night charge.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="glass-data-strong rounded-xl border p-5">
              <p className="text-sm text-muted-foreground">Starting from</p>
              <p className="text-3xl font-bold">
                {hotel.minPrice != null ? (
                  <>
                    {gbp(hotel.minPrice)}
                    <span className="text-base font-normal text-muted-foreground">
                      /night
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-medium text-muted-foreground">
                    Price on request
                  </span>
                )}
              </p>
              <Button asChild className="mt-4 w-full">
                <Link
                  to="/hotels/$hotelId/book"
                  params={{ hotelId: String(hotel.id) }}
                >
                  Check availability & book
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
