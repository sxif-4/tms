import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import { meQueryOptions, useLogout } from "~/features/auth";

export function SiteHeader() {
  const { data: user } = useQuery(meQueryOptions);
  const logout = useLogout();
  const { pathname } = useLocation();

  // Auth pages use a full-screen split layout without the app header.
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/dashboard")
  )
    return null;

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Link to="/" className="font-semibold">
        Island Booking
      </Link>
      <nav className="flex items-center gap-2">
        {user ? (
          <>
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {user.name} · {user.role}
            </span>
            {user.role === "admin" && (
              <Link
                to="/dashboard/admin"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Admin
              </Link>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Sign in
            </Link>
            <Link to="/signup" className={buttonVariants({ size: "sm" })}>
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
