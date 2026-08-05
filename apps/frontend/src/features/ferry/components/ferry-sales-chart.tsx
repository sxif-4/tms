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
import { gbp } from "../constants";
import type { FerrySalesRow } from "../types";

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

/**
 * Period keys differ by grouping: `2026-08-05`, `2026-W31` or `2026-08`. Only
 * the day form parses as a date, so the others are shown as-is.
 */
function fmtPeriod(key: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return new Date(key).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  }
  if (/^\d{4}-\d{2}$/.test(key)) {
    return new Date(`${key}-01`).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  }
  return key.replace("-W", " week ");
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number; name: string; dataKey: string }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover rounded-lg border p-2 text-xs shadow-md">
      <div className="mb-1 font-medium">{fmtPeriod(label ?? "")}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ background: "var(--series-ferry)" }}
          />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="ml-auto tabular-nums">
            {entry.dataKey === "revenue" ? gbp(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Ferry revenue over time, on the ferry accent token so the domains stay
 * visually distinct. Mirrors the park and hotel revenue charts.
 */
export function FerrySalesChart({ data }: { data: FerrySalesRow[] }) {
  return (
    <ClientOnly
      fallback={<div className="bg-muted h-72 animate-pulse rounded-lg" />}
    >
      <ResponsiveContainer width="100%" height={288}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="key"
            tickFormatter={fmtPeriod}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v) => gbp(v as number)}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="var(--series-ferry)"
            strokeWidth={2}
            fill="var(--series-ferry)"
            fillOpacity={0.25}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ClientOnly>
  );
}
