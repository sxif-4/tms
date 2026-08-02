import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { AmenityIcon } from "~/lib/amenity-icon";
import { amenitiesQueryOptions } from "../queries";
import type { RoomTypeAmenity } from "../types";
import { amenityCategoryLabel } from "../utils";

/**
 * Checkbox grid over the shared amenity catalog, grouped by category. The
 * catalog is fixed taxonomy — staff pick from it rather than inventing entries.
 */
export function AmenityPicker({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const {
    data: amenities,
    isPending,
    isError,
    error,
  } = useQuery(amenitiesQueryOptions);

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading amenities…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load amenities"}
      </p>
    );
  }

  const groups = new Map<string, RoomTypeAmenity[]>();
  for (const amenity of amenities) {
    const existing = groups.get(amenity.category);
    if (existing) existing.push(amenity);
    else groups.set(amenity.category, [amenity]);
  }

  const toggle = (id: number, checked: boolean) =>
    onChange(
      checked ? [...selected, id] : selected.filter((known) => known !== id),
    );

  return (
    <div className="flex flex-col gap-4">
      {[...groups.entries()].map(([category, items]) => (
        <div key={category} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">
            {amenityCategoryLabel(category)}
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {items.map((amenity) => {
              const id = `amenity-${amenity.id}`;
              return (
                <div key={amenity.id} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={selected.includes(amenity.id)}
                    onCheckedChange={(checked) =>
                      toggle(amenity.id, checked === true)
                    }
                  />
                  <Label
                    htmlFor={id}
                    className="flex items-center gap-1.5 font-normal"
                  >
                    <AmenityIcon name={amenity.icon} />
                    {amenity.name}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        {selected.length} selected
      </p>
    </div>
  );
}
