/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import * as React from "react";
import type { QueryClient } from "@tanstack/react-query";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { SiteFooter } from "~/components/SiteFooter";
import { SiteHeader } from "~/components/SiteHeader";
import { Toaster } from "~/components/ui/sonner";
import { meQueryOptions } from "~/features/auth";
import appCss from "~/styles/app.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions);
    return { user };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

/**
 * Screens that bring their own full-height chrome and must not be wrapped in
 * the marketing header/footer: the auth pages, and the whole staff dashboard,
 * which runs inside `AppShell`'s sidebar layout.
 */
function isChromeless(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/dashboard")
  );
}

function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const minimalChrome = useRouterState({
    select: (state) =>
      state.matches.some((match) => match.staticData.chrome === "minimal"),
  });

  // Header and footer are mounted once, here, and share a single visibility
  // rule — so a new visitor page gets both for free, and neither can drift
  // onto a dashboard page that already has its own shell.
  const showChrome = !minimalChrome && !isChromeless(pathname);

  return (
    <RootDocument>
      {showChrome && <SiteHeader />}
      {/* Takes up the slack on short pages so the footer sits at the bottom of
          the viewport rather than halfway up it. */}
      <div className="flex-1">
        <Outlet />
      </div>
      {showChrome && <SiteFooter />}
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Apply the saved theme before paint to avoid a flash of the wrong mode. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark', t ? t==='dark' : true);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-background text-foreground flex min-h-svh flex-col">
        {children}
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-right" />
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
