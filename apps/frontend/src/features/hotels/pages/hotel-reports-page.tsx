import { useSuspenseQuery } from "@tanstack/react-query";
import { HotelIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { EmptyState } from "../components/empty-state";
import { HotelSwitcher } from "../components/hotel-switcher";
import { OccupancyTrendChart } from "../components/occupancy-trend-chart";
import { RevenueTrendChart } from "../components/revenue-trend-chart";
import { useCurrentHotel } from "../hooks/use-current-hotel";
import { hotelOccupancyQueryOptions, hotelRevenueQueryOptions } from "../queries";

export function HotelReportsPage() {
  const { hotels, hotel, hotelId, setHotelId } = useCurrentHotel();

  if (!hotel || hotelId == null) {
    return (
      <EmptyState
        icon={HotelIcon}
        title="No hotel assigned yet"
        description="Your account isn't assigned to a hotel yet. Ask an administrator to assign you to one to get started."
      />
    );
  }

  return (
    <HotelReportsContent hotelId={hotelId} hotels={hotels} onHotelChange={setHotelId} />
  );
}

function HotelReportsContent({
  hotelId,
  hotels,
  onHotelChange,
}: {
  hotelId: number;
  hotels: ReturnType<typeof useCurrentHotel>["hotels"];
  onHotelChange: (id: number) => void;
}) {
  const { data: revenue } = useSuspenseQuery(hotelRevenueQueryOptions(hotelId));
  const { data: occupancy } = useSuspenseQuery(hotelOccupancyQueryOptions(hotelId));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Revenue and occupancy trends for this hotel, last 30 to next 30 days.
          </p>
        </div>
        <HotelSwitcher hotels={hotels} value={hotelId} onChange={onHotelChange} />
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle>Revenue over time</CardTitle>
            <CardDescription>By check-in date</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RevenueTrendChart data={revenue} />
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle>Occupancy over time</CardTitle>
            <CardDescription>Share of rooms occupied per day</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <OccupancyTrendChart data={occupancy} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
