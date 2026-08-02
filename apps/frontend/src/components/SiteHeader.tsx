import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { meQueryOptions, useLogout } from "~/features/auth";
import { cn } from "~/lib/utils";

const NAV_LINKS = [
  { to: "/hotels", label: "Destinations" },
  { to: "/hotels", label: "Hotels" },
  { to: "/theme-park", label: "Theme Park" },
  { to: "/theme-park", label: "Beach Events" },
  { to: "/map", label: "Island Map" },
] as const;

export function SiteHeader() {
  const { data: user } = useQuery(meQueryOptions);
  const logout = useLogout();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/dashboard")
  ) {
    return null;
  }

  // On the landing page the bar floats over the hero image until you scroll.
  const overlay = isHome && !scrolled;

  return (
    <header
      className={cn(
        "top-0 z-50 w-full",
        isHome ? "fixed" : "sticky",
        overlay
          ? "bg-transparent"
          : "glass-data-strong border-b border-border/40",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link
          to="/"
          className={cn(
            "text-xl font-extrabold tracking-tight sm:text-2xl",
            overlay && "text-white drop-shadow-sm",
          )}
        >
          FUNISLAND
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                overlay
                  ? "text-white/80 hover:bg-white/10 hover:text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "hidden h-10 items-center rounded-full px-5 text-sm font-semibold transition-colors sm:inline-flex",
                    overlay
                      ? "bg-white text-zinc-900 hover:bg-white/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  My account
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link to="/my-bookings">My bookings</Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/admin">Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => logout.mutate()}
                  disabled={logout.isPending}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className={cn(
                "hidden h-10 items-center rounded-full px-6 text-sm font-semibold transition-colors sm:inline-flex",
                overlay
                  ? "bg-white text-zinc-900 hover:bg-white/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              Sign in
            </Link>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-lg"
                className={cn(
                  "rounded-full lg:hidden",
                  overlay &&
                    "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white",
                )}
              >
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="mt-10 flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link
                      to="/my-bookings"
                      onClick={() => setOpen(false)}
                      className="mt-3 rounded-full border px-3 py-2.5 text-center text-sm font-semibold"
                    >
                      My bookings
                    </Link>
                    <Button
                      variant="ghost"
                      className="mt-1 h-10"
                      onClick={() => {
                        setOpen(false);
                        logout.mutate();
                      }}
                      disabled={logout.isPending}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="mt-3 rounded-full bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                  >
                    Sign in
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
