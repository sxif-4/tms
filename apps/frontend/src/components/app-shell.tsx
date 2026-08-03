import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { TooltipProvider } from "~/components/ui/tooltip";
import { AppHeader } from "~/components/app-header";
import { AppSidebar } from "~/components/app-sidebar";

/**
 * Dashboard chrome: a white sidebar and header, and a muted grey content area
 * that runs edge to edge. Cards and tables inside it stay `--card` white, which
 * is what separates content from the page — so pages shouldn't paint their own
 * page-level background.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    // The collapsed rail has to fit a 40px icon button plus the 16px indent the
    // nav items carry (SidebarContent `px-2` + SidebarGroup `p-2`) on each
    // side. The stock 3rem is narrower than the button itself.
    <TooltipProvider>
      <SidebarProvider
        style={{ "--sidebar-width-icon": "4.5rem" } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <AppHeader />
          <div className="flex w-full min-w-0 flex-1 flex-col bg-surface p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
