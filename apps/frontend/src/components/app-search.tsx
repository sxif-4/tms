"use client";

import { useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getNavGroups } from "~/components/app-shared";
import {
  CommandDialog,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Kbd, KbdGroup } from "~/components/ui/kbd";
import { useCurrentUser } from "~/features/auth";

/**
 * Header search. There's no cross-domain search API yet, so this searches what
 * the shell already knows about — the destinations available to this role —
 * and jumps to them. Opens with ⌘K / Ctrl+K.
 */
export function AppSearch() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Placeholder (`#/...`) destinations have nowhere to go, so they're left out.
  const groups = getNavGroups(user?.role)
    .map((group, index) => ({
      label: group.label ?? `Group ${index + 1}`,
      items: group.items
        .flatMap((item) => (item.subItems?.length ? item.subItems : [item]))
        .flatMap((item) =>
          item.path && !item.path.startsWith("#")
            ? [{ ...item, path: item.path }]
            : [],
        ),
    }))
    .filter((group) => group.items.length > 0);

  const go = (path: string) => {
    setOpen(false);
    navigate({ to: path });
  };

  return (
    <>
      <button
        aria-label="Search"
        className="flex h-10 shrink-0 items-center gap-2 rounded-full border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:w-64 md:pr-2 md:pl-4"
        onClick={() => setOpen(true)}
        type="button"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="hidden flex-1 text-left md:inline">Search pages</span>
        <KbdGroup className="hidden md:inline-flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>

      <CommandDialog
        description="Jump to a page"
        onOpenChange={setOpen}
        open={open}
        title="Search"
      >
        <Command>
          <CommandInput placeholder="Search pages…" />
          <CommandList>
            <CommandEmpty>No pages found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup heading={group.label} key={group.label}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.path}
                    onSelect={() => go(item.path)}
                    value={`${group.label} ${item.title}`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
