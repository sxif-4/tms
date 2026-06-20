import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "../../components/app-shell";
import { DashboardSkeleton } from "../../components/dashboard-skeleton";

/** Layout guard for everything under /admin: requires an authenticated admin. */
export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (context.user.role == "visitor") {
      throw redirect({ to: "/" });
    }
  },
  component: () => DashboardLayout(),
});

function DashboardLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
