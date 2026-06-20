import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Reactively tracks the active theme by observing the `.dark` class on <html>,
 * so it follows the class-toggling ModeToggle without any provider. Starts as
 * "dark" to match SSR (and avoid a hydration mismatch), then syncs after mount.
 */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}
