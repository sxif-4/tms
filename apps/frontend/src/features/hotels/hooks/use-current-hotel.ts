import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { hotelsQueryOptions } from "../queries";
import type { Hotel } from "../types";

/**
 * Resolves "the current hotel" for a hotel_staff page. Most staff are
 * assigned exactly one hotel, so this defaults to the first one in the
 * scoped list; a `setHotelId` setter is exposed for the rare multi-hotel
 * case where a page renders a switcher.
 */
export function useCurrentHotel(): {
  hotels: Hotel[];
  hotel: Hotel | null;
  hotelId: number | null;
  setHotelId: (id: number) => void;
} {
  const { data: hotels } = useSuspenseQuery(hotelsQueryOptions);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const hotel = selectedId
    ? (hotels.find((h) => h.id === selectedId) ?? hotels[0] ?? null)
    : (hotels[0] ?? null);

  return {
    hotels,
    hotel,
    hotelId: hotel?.id ?? null,
    setHotelId: setSelectedId,
  };
}
