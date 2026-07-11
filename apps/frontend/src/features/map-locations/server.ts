import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type { MapLocation } from "./types";

const inputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  type: z.enum([
    "hotel",
    "ferry_terminal",
    "attraction",
    "beach",
    "restaurant",
    "landmark",
  ]),
  positionTop: z.number().min(0).max(100),
  positionLeft: z.number().min(0).max(100),
});

/** Lists all map locations. Public on the API — used by both admin and visitors. */
export const getMapLocationsServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<MapLocation[]> => {
    const res = await apiFetch("/map-locations");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load locations"));
    return (await res.json()) as MapLocation[];
  },
);

export const createMapLocationServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<MapLocation> => {
    const res = await apiFetch("/map-locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to create location"));
    return (await res.json()) as MapLocation;
  });

const updateSchema = inputSchema
  .partial()
  .extend({ id: z.number().int().positive() });

export const updateMapLocationServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data }): Promise<MapLocation> => {
    const { id, ...body } = data;
    const res = await apiFetch(`/map-locations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update location"));
    return (await res.json()) as MapLocation;
  });

export const deleteMapLocationServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: z.number() }).parse(input))
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/map-locations/${data.id}`, {
      method: "DELETE",
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to delete location"));
  });

export interface HotelPin {
  id: number;
  positionTop: string | null;
  positionLeft: string | null;
}

/**
 * Minimal hotel pin lookup for the visitor island map — self-contained (calls
 * `/public/hotels` directly) so this feature doesn't depend on the
 * `hotel-browsing` feature's internals. Matches a `hotel`-type map location
 * to its hotel by comparing position, since `/public/hotels` doesn't return
 * `mapLocationId` directly.
 */
export const getPublicHotelPinsServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<HotelPin[]> => {
  const res = await apiFetch("/public/hotels");
  if (!res.ok) return [];
  return (await res.json()) as HotelPin[];
});
