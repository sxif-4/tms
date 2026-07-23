import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { landingPathForRole } from "~/features/auth";

/**
 * Layout guard for everything under /dashboard/park: requires an authenticated
 * admin or park_staff user, mirroring dashboard/hotel/route.tsx.
 */
export const Route = createFileRoute("/dashboard/park")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (context.user.role !== "admin" && context.user.role !== "park_staff") {
      throw redirect({ to: landingPathForRole(context.user.role) });
    }
  },
  component: () => <Outlet />,
});
