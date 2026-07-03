import { type ReactNode, useEffect, useState } from "react";

/**
 * Renders children only after mount. Use to keep DOM-measuring libraries
 * (recharts, leaflet) out of the SSR pass and avoid hydration mismatches.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
