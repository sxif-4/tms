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
import { DOMAINS, gbp } from "../constants";
import type { SalesPoint } from "../types";

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };
const colorFor = (key: string) =>
  DOMAINS.find((d) => d.key === key)?.color ?? "var(--muted-foreground)";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey: string; name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
      <div className="mb-1 font-medium">{fmtDate(label ?? "")}</div>
      {[...payload].reverse().map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ background: colorFor(p.dataKey) }}
          />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto tabular-nums">{gbp(p.value)}</span>
        </div>
      ))}
      <div className="mt-1 flex justify-between border-t pt-1 font-medium">
        <span>Total</span>
        <span className="tabular-nums">{gbp(total)}</span>
      </div>
    </div>
  );
}

export function RevenueOverTimeChart({ data }: { data: SalesPoint[] }) {
  return (
    <ClientOnly
      fallback={<div className="h-72 animate-pulse rounded-lg bg-muted" />}
    >
      <ResponsiveContainer width="100%" height={288}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
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
            width={52}
            tickFormatter={(v) => gbp(v as number)}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          {DOMAINS.map((d) => (
            <Area
              key={d.key}
              type="monotone"
              dataKey={d.key}
              name={d.label}
              stackId="revenue"
              stroke="var(--card)"
              strokeWidth={1.5}
              fill={d.color}
              fillOpacity={0.9}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ClientOnly>
  );
}
