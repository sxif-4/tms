import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ModeToggle } from "~/components/mode-toggle";
import { cn } from "~/lib/utils";

const BOOK_LINKS = [
  { label: "Hotels & rooms", to: "/hotels" },
  { label: "Ferry crossings", to: "/ferry" },
  { label: "Theme park", to: "/theme-park" },
  { label: "Park tickets", to: "/theme-park/tickets" },
  { label: "Island map", to: "/map" },
] as const;

const ACCOUNT_LINKS = [
  { label: "My bookings", to: "/my-bookings" },
  { label: "Sign in", to: "/login" },
  { label: "Create an account", to: "/signup" },
] as const;

const linkClass =
  "text-sm text-white/60 transition-colors hover:text-white focus-visible:text-white";

const headingClass =
  "font-mono text-[11px] font-semibold tracking-[0.22em] uppercase";

export function SiteFooter() {
  return (
    // The page always ends on night, in either theme, so everything inside is
    // painted with the white/alpha ramp rather than the light/dark tokens.
    <footer className="bg-footer text-white">
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* The desk: who you'd call, and where the boat leaves from. */}
          <div className="lg:col-span-4">
            <Link
              to="/"
              className="text-xl font-extrabold tracking-tight"
              aria-label="FUNISLAND home"
            >
              FUNISLAND
            </Link>

            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => e.preventDefault()}
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>

            <address className="mt-8 space-y-4 text-sm text-white/60 not-italic">
              <p className="text-white/75">
                Jetty 4, Harbour Terminal
                <br />
                Picnic Island · 3°12′N 73°04′E
              </p>
              <p>
                <a
                  href="mailto:guests@funisland.example"
                  className="transition-colors hover:text-white"
                >
                  guests@funisland.example
                </a>
              </p>
              <p>
                <a
                  href="tel:+9604001190"
                  className="transition-colors hover:text-white"
                >
                  (+960) 400 1190
                </a>
              </p>
            </address>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
            <FooterColumn title="Book">
              {BOOK_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title="Your trip">
              {ACCOUNT_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <DeadLink>Gate passes</DeadLink>
              </li>
              <li>
                <DeadLink>Changes & refunds</DeadLink>
              </li>
            </FooterColumn>

            <FooterColumn title="Island" className="col-span-2 sm:col-span-1">
              <li>
                <Link to="/about" className={linkClass}>
                  About the island
                </Link>
              </li>
              <li>
                <a href="mailto:guests@funisland.example" className={linkClass}>
                  Guest services
                </a>
              </li>
              <li>
                <Link to="/login" className={linkClass}>
                  Staff sign in
                </Link>
              </li>
              <li>
                <DeadLink>Careers</DeadLink>
              </li>
              <li>
                <DeadLink>Press kit</DeadLink>
              </li>
            </FooterColumn>
          </div>
        </div>

        {/* The rule the reference hangs its CTA on — trust marks at one end,
            the booking pill at the other, hairline stretching between. */}
        <div className="mt-14 flex flex-col gap-6 sm:mt-16 sm:flex-row sm:items-center sm:gap-6">
          {/* The footer's own take on PaymentTrustBadges — that component is
              token-styled and would go unreadable on this ink in light mode. */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/55">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-white/80" />
              Secure checkout
            </span>
            {["Visa", "Mastercard", "Amex"].map((card) => (
              <span
                key={card}
                className="rounded-md border border-white/15 px-2 py-0.5"
              >
                {card}
              </span>
            ))}
          </div>

          <div className="hidden h-px flex-1 bg-white/15 sm:block" />

          <Link
            to="/hotels"
            className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white/85"
          >
            Plan a trip
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-6 pb-10 sm:mt-10 lg:flex-row lg:items-start lg:justify-between">
          <p className="max-w-sm text-xs leading-relaxed text-white/45">
            Rooms, crossings and ride days booked in one go — and one reference
            number to show at the gate. Prices in GBP, taxes included.
          </p>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <DeadLink className={legalClass}>Terms &amp; conditions</DeadLink>
            <DeadLink className={legalClass}>Privacy policy</DeadLink>
            <span className={cn(legalClass, "text-white/35")}>
              © 2026 FUNISLAND
            </span>
            <ModeToggle className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white dark:border-white/20 dark:bg-transparent dark:hover:bg-white/10" />
          </div>
        </div>
      </div>

      <Wordmark />
    </footer>
  );
}

/**
 * The oversized sign-off. Purely decorative — the readable brand link lives up
 * in the contact column — so it is hidden from assistive tech and cropped at
 * the baseline by the clipping parent, the way a painted sign runs off a wall.
 */
function Wordmark() {
  return (
    <div
      aria-hidden
      className="overflow-hidden px-4 select-none sm:px-6 lg:px-8"
    >
      <span className="block mb-[-0.1em] bg-linear-to-b from-white/22 to-white/4 bg-clip-text text-center text-[min(17.5vw,15rem)] leading-[0.75] font-extrabold tracking-[-0.045em] whitespace-nowrap text-transparent">
        FUNISLAND
      </span>
    </div>
  );
}

function FooterColumn({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <h2 className={headingClass}>{title}</h2>
      <ul className="mt-5 space-y-3">{children}</ul>
    </div>
  );
}

const legalClass =
  "font-mono text-[11px] tracking-[0.16em] uppercase text-white/55 transition-colors hover:text-white";

/**
 * Stands in for pages the app doesn't have yet (careers, press, the legal
 * pair). It renders as a real link so the layout is honest, but swallows the
 * click rather than jumping to the top of the page like a bare `#` would.
 */
function DeadLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className={cn(linkClass, className)}
    >
      {children}
    </a>
  );
}

/**
 * lucide dropped its brand icons in v1, so the three marks are inlined. They
 * are drawn on the 24px lucide grid to sit level with the rest of the icons.
 */
type IconProps = { className?: string };

function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z" />
    </svg>
  );
}

function YoutubeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" fill="currentColor" />
    </svg>
  );
}

const SOCIALS = [
  { label: "FUNISLAND on Instagram", href: "#", Icon: InstagramIcon },
  { label: "FUNISLAND on X", href: "#", Icon: XIcon },
  { label: "FUNISLAND on YouTube", href: "#", Icon: YoutubeIcon },
] as const;
