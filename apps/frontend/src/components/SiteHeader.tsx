import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, Palmtree } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "~/components/ui/sheet";
import { ModeToggle } from "~/components/mode-toggle";
import { meQueryOptions, useLogout } from "~/features/auth";
import { cn } from "~/lib/utils";

const NAV_LINKS = [
  { to: "/hotels", label: "Hotels" },
  { to: "/map", label: "Map" },
  { to: "/ferry", label: "Ferry", badge: "Soon" },
  { to: "/theme-park", label: "Theme Park", badge: "Soon" },
] as const;

export function SiteHeader() {
  const { data: user } = useQuery(meQueryOptions);
  const logout = useLogout();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/dashboard")
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-data-strong border-b border-border/40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Palmtree className="size-5" />
            </span>
            <span className="hidden text-lg sm:inline">Island Booking</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {link.label}
                    {"badge" in link && link.badge && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {link.badge}
                      </span>
                    )}
                    {active && (
                      <span className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-primary" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/my-bookings"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "hidden sm:inline-flex",
                  )}
                >
                  My bookings
                </Link>
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
            <ModeToggle />

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="size-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <nav className="mt-8 flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user ? (
                    <Link
                      to="/my-bookings"
                      onClick={() => setOpen(false)}
                      className="mt-2 rounded-md border px-3 py-2.5 text-sm font-medium"
                    >
                      My bookings
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="mt-2 rounded-md border px-3 py-2.5 text-sm font-medium"
                    >
                      Sign in
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
