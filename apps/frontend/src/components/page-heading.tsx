import { useLocation } from "@tanstack/react-router";
import { getPageMeta } from "~/components/page-meta";

/**
 * The page's title and lead line, rendered at the top of the content area. The
 * copy comes from the `page-meta` registry, keyed by route — a page only has to
 * place this next to its own actions. Pages whose heading depends on loaded
 * data (a room type's name, say) write their own instead.
 */
export function PageHeading() {
  const { pathname } = useLocation();
  const meta = getPageMeta(pathname);

  if (!meta) return null;

  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {meta.title}
      </h1>
      {meta.description && (
        <p className="max-w-2xl text-sm text-muted-foreground">
          {meta.description}
        </p>
      )}
    </div>
  );
}
