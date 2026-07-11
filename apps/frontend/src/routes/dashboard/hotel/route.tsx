import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { landingPathForRole } from "~/features/auth";

/**
 * Layout guard for everything under /dashboard/hotel: requires an
 * authenticated admin or hotel_staff user, mirroring dashboard/admin/route.tsx.
 */
export const Route = createFileRoute("/dashboard/hotel")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (context.user.role !== "admin" && context.user.role !== "hotel_staff") {
      throw redirect({ to: landingPathForRole(context.user.role) });
    }
  },
  component: () => <Outlet />,
});
