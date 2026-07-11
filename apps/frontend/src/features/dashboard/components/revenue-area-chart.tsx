import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ClientOnly } from "~/components/client-only";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { DOMAINS, gbp } from "~/features/reports/constants";
import type { SalesPoint } from "~/features/reports/types";

const chartConfig = Object.fromEntries(
  DOMAINS.map((d) => [d.key, { label: d.label, color: d.color }]),
) satisfies ChartConfig;

const fmtDate = (value: string | number) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

/** shadcn stacked area chart: revenue over time, split by source. */
export function RevenueAreaChart({ data }: { data: SalesPoint[] }) {
  return (
    <ClientOnly
      fallback={<div className="h-72 animate-pulse rounded-lg bg-muted" />}
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
        <AreaChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
          <defs>
            {DOMAINS.map((d) => (
              <linearGradient
                key={d.key}
                id={`fill-${d.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={`var(--color-${d.key})`}
                  stopOpacity={0.7}
                />
                <stop
                  offset="95%"
                  stopColor={`var(--color-${d.key})`}
                  stopOpacity={0.05}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
          />
          <YAxis
            width={56}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => gbp(v as number)}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => fmtDate(label as string)}
                formatter={(value, name) => (
                  <div className="flex w-full items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-xs"
                      style={{ background: `var(--color-${name})` }}
                    />
                    <span className="text-muted-foreground">
                      {chartConfig[name as keyof typeof chartConfig]?.label ??
                        name}
                    </span>
                    <span className="ml-auto font-mono font-medium text-foreground tabular-nums">
                      {gbp(value as number)}
                    </span>
                  </div>
                )}
              />
            }
          />
          {DOMAINS.map((d) => (
            <Area
              key={d.key}
              dataKey={d.key}
              type="monotone"
              stackId="revenue"
              stroke={`var(--color-${d.key})`}
              fill={`url(#fill-${d.key})`}
              fillOpacity={1}
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </ClientOnly>
  );
}
