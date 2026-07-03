import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClientOnly } from "~/components/client-only";
import { gbp } from "../constants";

export interface DomainTotal {
  domain: string;
  label: string;
  color: string;
  revenue: number;
}

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DomainTotal }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ background: d.color }}
        />
        <span className="text-muted-foreground">{d.label}</span>
        <span className="ml-auto tabular-nums">{gbp(d.revenue)}</span>
      </div>
    </div>
  );
}

export function RevenueByDomainChart({ data }: { data: DomainTotal[] }) {
  return (
    <ClientOnly
      fallback={<div className="h-72 animate-pulse rounded-lg bg-muted" />}
    >
      <ResponsiveContainer width="100%" height={288}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
        >
          <XAxis
            type="number"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => gbp(v as number)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<BarTooltip />} />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={28}>
            {data.map((d) => (
              <Cell key={d.domain} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ClientOnly>
  );
}
