import { Link } from "@tanstack/react-router";
import { AlertTriangleIcon, ArrowRightIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { HotelDashboardResponse } from "../types";

type Row = { key: string; label: string; to: "/dashboard/hotel/bookings" | "/dashboard/hotel/rooms" };

/** Renders only when there's at least one actionable item across the three priority buckets. */
export function PriorityActionCard({
  priorityActions,
}: {
  priorityActions: HotelDashboardResponse["priorityActions"];
}) {
  const { unassignedUpcoming, pendingConfirmations, roomsInMaintenance } =
    priorityActions;

  const rows: Row[] = [];
  if (unassignedUpcoming.total > 0) {
    rows.push({
      key: "unassigned",
      label: `${unassignedUpcoming.total} upcoming booking${unassignedUpcoming.total > 1 ? "s" : ""} need${unassignedUpcoming.total > 1 ? "" : "s"} a room assigned`,
      to: "/dashboard/hotel/bookings",
    });
  }
  if (pendingConfirmations.total > 0) {
    rows.push({
      key: "pending",
      label: `${pendingConfirmations.total} booking${pendingConfirmations.total > 1 ? "s" : ""} awaiting confirmation`,
      to: "/dashboard/hotel/bookings",
    });
  }
  if (roomsInMaintenance.total > 0) {
    rows.push({
      key: "maintenance",
      label: `${roomsInMaintenance.total} room${roomsInMaintenance.total > 1 ? "s" : ""} out of service`,
      to: "/dashboard/hotel/rooms",
    });
  }

  if (rows.length === 0) return null;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangleIcon className="size-4 text-destructive" />
          Needs your attention
        </CardTitle>
        <CardDescription>
          A few things before they become guest-facing problems.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.map((row) => (
          <Link
            key={row.key}
            to={row.to}
            className="group flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <span>{row.label}</span>
            <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
