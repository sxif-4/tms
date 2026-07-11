import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { SalesPoint } from "~/features/reports/types";
import { RevenueAreaChart } from "./revenue-area-chart";

export function RevenueBySourceCard({ data }: { data: SalesPoint[] }) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle>Revenue by source</CardTitle>
        <CardDescription>Booked value over time, split by source</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <RevenueAreaChart data={data} />
      </CardContent>
    </Card>
  );
}
