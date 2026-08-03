import { useQuery } from "@tanstack/react-query";
import { SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Label } from "~/components/ui/label";
import { AmenityIcon } from "~/lib/amenity-icon";
import { facilitiesQueryOptions } from "../queries";
import type { Facility } from "../types";
import { facilityCategoryLabel } from "../utils";

/**
 * Checkbox grid over the shared facility catalog, grouped by category. The
 * catalog is long enough to scroll past, so it's searchable, and everything
 * already picked is summarised as chips at the top — otherwise the only way to
 * answer "what did I select?" is to scroll the whole list looking for ticks.
 */
export function FacilityPicker({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const { data, isPending, isError, error } = useQuery(facilitiesQueryOptions);
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();

  const groups = useMemo(() => {
    const matches = (data ?? []).filter(
      (facility) =>
        !term ||
        facility.name.toLowerCase().includes(term) ||
        facilityCategoryLabel(facility.category).toLowerCase().includes(term),
    );

    const byCategory = new Map<string, Facility[]>();
    for (const facility of matches) {
      const existing = byCategory.get(facility.category);
      if (existing) existing.push(facility);
      else byCategory.set(facility.category, [facility]);
    }
    return [...byCategory.entries()];
  }, [data, term]);

  const selectedFacilities = (data ?? []).filter((facility) =>
    selected.includes(facility.id),
  );

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading facilities…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load facilities"}
      </p>
    );
  }

  const toggle = (id: number, checked: boolean) =>
    onChange(
      checked ? [...selected, id] : selected.filter((known) => known !== id),
    );

  return (
    <div className="flex flex-col gap-3">
      {selectedFacilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedFacilities.map((facility) => (
            <Badge asChild key={facility.id} variant="secondary">
              <button
                aria-label={`Remove ${facility.name}`}
                onClick={() => toggle(facility.id, false)}
                type="button"
              >
                <AmenityIcon name={facility.icon} />
                {facility.name}
                <XIcon className="opacity-60" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* InputGroupInput, not Input — the plain control keeps its own border
          and focus ring, which double up with the group's. */}
      <InputGroup className="h-9">
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search facilities"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search facilities…"
          value={search}
        />
      </InputGroup>

      {groups.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          No facilities match “{search.trim()}”.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([category, items]) => (
            <div key={category} className="flex flex-col gap-2">
              <h3 className="border-b pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-foreground uppercase">
                {facilityCategoryLabel(category)}
              </h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((facility) => {
                  const id = `facility-${facility.id}`;
                  return (
                    <div key={facility.id} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={selected.includes(facility.id)}
                        onCheckedChange={(checked) =>
                          toggle(facility.id, checked === true)
                        }
                      />
                      <Label
                        htmlFor={id}
                        className="flex items-center gap-1.5 font-normal"
                      >
                        <AmenityIcon name={facility.icon} />
                        {facility.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
