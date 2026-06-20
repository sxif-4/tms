"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

/**
 * Toggles the `.dark` class on <html> and persists the choice. The icon is
 * driven purely by the `dark:` variant, so it stays correct even before React
 * hydrates (the anti-FOUC script in __root applies the saved theme first).
 */
export function ModeToggle() {
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  return (
    <Button
      aria-label="Toggle theme"
      onClick={toggleTheme}
      size="icon-sm"
      variant="outline"
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  );
}
