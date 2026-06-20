import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppHeader } from "~/components/app-header";
import { AppSidebar } from "~/components/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex w-full flex-1 flex-col p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
