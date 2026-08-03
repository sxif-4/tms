import { AppSearch } from "~/components/app-search";
import { CustomSidebarTrigger } from "~/components/custom-sidebar-trigger";
import { ModeToggle } from "~/components/mode-toggle";
import { NavUser } from "~/components/nav-user";

/**
 * Top bar: chrome only. The page's own title lives in the content area — see
 * `PageHeading` — so this stays a slim strip of global controls.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 flex shrink-0 items-center justify-between gap-3 border-b bg-surface px-4 py-2.5 md:px-6">
      <CustomSidebarTrigger />
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <AppSearch />
        <ModeToggle className="size-10 rounded-full bg-background hover:bg-muted" />
        <NavUser />
      </div>
    </header>
  );
}
