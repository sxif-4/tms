import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Hotel } from "../types";

/**
 * Minimal hotel switcher — only rendered by pages when a staff member is
 * assigned to more than one hotel (the common case is exactly one, where
 * this is skipped entirely).
 */
export function HotelSwitcher({
  hotels,
  value,
  onChange,
}: {
  hotels: Hotel[];
  value: number;
  onChange: (id: number) => void;
}) {
  if (hotels.length <= 1) return null;

  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger aria-label="Switch hotel">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {hotels.map((h) => (
            <SelectItem key={h.id} value={String(h.id)}>
              {h.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
