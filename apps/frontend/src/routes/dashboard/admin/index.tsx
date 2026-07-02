import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  PoundSterlingIcon,
  TicketIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export const Route = createFileRoute("/dashboard/admin/")({
  component: AdminDashboardPage,
});

/**
 * KPI shell — values are placeholders until the reports module lands (Phase 4),
 * which will feed these cards from `GET /reports/overview`.
 */
const STATS: { label: string; icon: LucideIcon; hint: string }[] = [
  { label: "Total users", icon: UsersIcon, hint: "Registered accounts" },
  {
    label: "Active bookings",
    icon: CalendarCheckIcon,
    hint: "Confirmed & upcoming",
  },
  { label: "Revenue", icon: PoundSterlingIcon, hint: "Completed payments" },
  { label: "Tickets sold", icon: TicketIcon, hint: "Park & event tickets" },
];

function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          An overview of activity across the platform.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map(({ label, icon: Icon, hint }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">—</CardTitle>
              <CardAction>
                <Icon className="size-5 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <p className="text-xs text-muted-foreground">
        Live figures arrive with the reports module. In the meantime, manage the
        platform below.
      </p>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link to="/dashboard/admin/users" className="group">
          <Card className="transition-colors group-hover:ring-foreground/20">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Review accounts and manage roles.
              </CardDescription>
              <CardAction>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
          </Card>
        </Link>
      </section>
    </div>
  );
}
