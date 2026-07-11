import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClientOnly } from "~/components/client-only";
import type { OccupancyPoint } from "../types";

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: OccupancyPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
      <div className="mb-1 font-medium">{fmtDate(label ?? "")}</div>
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ background: "var(--series-hotel)" }}
        />
        <span className="text-muted-foreground">Occupancy rate</span>
        <span className="ml-auto tabular-nums">{point.occupancyRate}%</span>
      </div>
      <div className="text-muted-foreground">
        {point.occupiedRoomNights} of {point.totalRooms} rooms
      </div>
    </div>
  );
}

/** Single-series occupancy-rate-over-time area chart. Legend + axis ticks are always visible (no hover required to understand the chart). */
export function OccupancyTrendChart({ data }: { data: OccupancyPoint[] }) {
  return (
    <ClientOnly
      fallback={<div className="h-72 animate-pulse rounded-lg bg-muted" />}
    >
      <ResponsiveContainer width="100%" height={288}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tickFormatter={fmtDate}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={40}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          <Area
            type="monotone"
            dataKey="occupancyRate"
            name="Occupancy rate"
            stroke="var(--series-hotel)"
            strokeWidth={2}
            fill="var(--series-hotel)"
            fillOpacity={0.25}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ClientOnly>
  );
}
