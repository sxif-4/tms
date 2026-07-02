import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type { Advertisement } from "./types";

const placementSchema = z.enum(["homepage", "sidebar", "checkout", "map"]);

const inputSchema = z.object({
  title: z.string().trim().min(1).max(255),
  image: z.string().trim().min(1).max(500),
  targetUrl: z.string().trim().min(1).max(500),
  placement: placementSchema,
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  isActive: z.boolean(),
});

/** Lists all advertisements (admin-only on the API). */
export const getAdvertisementsServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<Advertisement[]> => {
  const res = await apiFetch("/advertisements");
  if (!res.ok)
    throw new Error(await errorMessage(res, "Failed to load advertisements"));
  return (await res.json()) as Advertisement[];
});

export const createAdvertisementServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<Advertisement> => {
    const res = await apiFetch("/advertisements", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to create advertisement"));
    return (await res.json()) as Advertisement;
  });

const updateSchema = inputSchema
  .partial()
  .extend({ id: z.number().int().positive() });

export const updateAdvertisementServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data }): Promise<Advertisement> => {
    const { id, ...body } = data;
    const res = await apiFetch(`/advertisements/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update advertisement"));
    return (await res.json()) as Advertisement;
  });

export const deleteAdvertisementServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: z.number() }).parse(input))
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/advertisements/${data.id}`, {
      method: "DELETE",
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to delete advertisement"));
  });
