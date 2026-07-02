import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { landingPathForRole } from "~/features/auth";

/**
 * Layout guard for everything under /dashboard/admin: requires an authenticated
 * admin. The parent /dashboard guard already blocks anonymous users and
 * visitors; this narrows the rest of the staff down to admins only, sending a
 * non-admin back to their own landing page (the API also enforces this).
 */
export const Route = createFileRoute("/dashboard/admin")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (context.user.role !== "admin") {
      throw redirect({ to: landingPathForRole(context.user.role) });
    }
  },
  component: () => <Outlet />,
});
