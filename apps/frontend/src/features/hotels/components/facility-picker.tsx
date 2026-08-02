import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { AmenityIcon } from "~/lib/amenity-icon";
import { facilitiesQueryOptions } from "../queries";
import type { Facility } from "../types";
import { facilityCategoryLabel } from "../utils";

/** Checkbox grid over the shared facility catalog, grouped by category. */
export function FacilityPicker({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const { data, isPending, isError, error } = useQuery(facilitiesQueryOptions);

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

  const groups = new Map<string, Facility[]>();
  for (const facility of data) {
    const existing = groups.get(facility.category);
    if (existing) existing.push(facility);
    else groups.set(facility.category, [facility]);
  }

  const toggle = (id: number, checked: boolean) =>
    onChange(
      checked ? [...selected, id] : selected.filter((known) => known !== id),
    );

  return (
    <div className="flex flex-col gap-3">
      {[...groups.entries()].map(([category, items]) => (
        <div key={category} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">
            {facilityCategoryLabel(category)}
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
  );
}
