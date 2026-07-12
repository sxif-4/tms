import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BedDoubleIcon,
  CalendarCheckIcon,
  DoorOpenIcon,
  HotelIcon,
  type LucideIcon,
  LogInIcon,
  LogOutIcon,
  PoundSterlingIcon,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { StatCard } from "~/features/reports/components/stat-card";
import { EmptyState } from "../components/empty-state";
import { HotelSwitcher } from "../components/hotel-switcher";
import { PriorityActionCard } from "../components/priority-action-card";
import { RevenueTrendChart } from "../components/revenue-trend-chart";
import { gbp } from "../constants";
import { useCurrentHotel } from "../hooks/use-current-hotel";
import { hotelDashboardQueryOptions } from "../queries";
import type { DaySheetRow } from "../types";

export function HotelDashboardPage() {
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
    <HotelDashboardContent
      hotelId={hotelId}
      hotels={hotels}
      onHotelChange={setHotelId}
    />
  );
}

function HotelDashboardContent({
  hotelId,
  hotels,
  onHotelChange,
}: {
  hotelId: number;
  hotels: ReturnType<typeof useCurrentHotel>["hotels"];
  onHotelChange: (id: number) => void;
}) {
  const { data } = useSuspenseQuery(hotelDashboardQueryOptions(hotelId));
  const hotelName = hotels.find((h) => h.id === hotelId)?.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">
            {hotelName ?? "Hotel"} dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            An overview of occupancy, bookings, and revenue.
          </p>
        </div>
        <HotelSwitcher
          hotels={hotels}
          value={hotelId}
          onChange={onHotelChange}
        />
      </div>

      {data.kpis.totalRooms === 0 ? (
        <EmptyState
          icon={BedDoubleIcon}
          title="Add your first room type to begin tracking occupancy"
          description="This hotel has no rooms set up yet. Create a room type and add rooms to start accepting bookings."
          action={
            <Button asChild>
              <Link to="/dashboard/hotel/rooms">Go to Rooms</Link>
            </Button>
          }
        />
      ) : (
        <>
          <PriorityActionCard priorityActions={data.priorityActions} />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Occupancy rate"
              value={`${data.kpis.occupancyRate}%`}
              hint={`${data.kpis.occupiedRooms} of ${data.kpis.totalRooms} rooms occupied`}
              icon={DoorOpenIcon}
            />
            <StatCard
              label="Active bookings"
              value={data.kpis.activeBookings}
              hint="Pending & confirmed"
              icon={CalendarCheckIcon}
            />
            <StatCard
              label="Revenue"
              value={gbp(data.kpis.revenueLast30Days)}
              hint="Last 30 days"
              icon={PoundSterlingIcon}
            />
            <StatCard
              label="Rooms"
              value={`${data.kpis.occupiedRooms} / ${data.kpis.totalRooms}`}
              hint="Occupied / total"
              icon={BedDoubleIcon}
            />
          </section>

          <Card className="p-4">
            <CardHeader className="p-0">
              <CardTitle>Revenue over time</CardTitle>
              <CardDescription>
                Bookings by check-in date, last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RevenueTrendChart data={data.revenueTrend} />
            </CardContent>
          </Card>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DaySheetCard
              title="Today's arrivals"
              icon={LogInIcon}
              rows={data.todaysArrivals}
            />
            <DaySheetCard
              title="Today's departures"
              icon={LogOutIcon}
              rows={data.todaysDepartures}
            />
          </section>
        </>
      )}
    </div>
  );
}

function DaySheetCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: LucideIcon;
  rows: DaySheetRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardDescription>{rows.length} today</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing scheduled today.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Room type</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Guests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.guestName}</TableCell>
                  <TableCell>{row.roomTypeName}</TableCell>
                  <TableCell>
                    {row.roomNumber ?? (
                      <Badge variant="outline">Unassigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>{row.guests}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
