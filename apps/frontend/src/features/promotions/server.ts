import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type { Promotion, PromotionUsage } from "./types";

const DECIMAL = /^\d+(\.\d{1,2})?$/;

const targetSchema = z.object({
  targetType: z.enum(["room_type", "event", "ferry_route"]),
  targetId: z.number().int().positive(),
});

const inputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  code: z.string().trim().max(50).optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.string().regex(DECIMAL),
  minSpend: z.string().regex(DECIMAL).optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  validFrom: z.string().min(1),
  validTo: z.string().min(1),
  isActive: z.boolean(),
  targets: z.array(targetSchema),
});

/** Lists all promotions with their targets (admin-only on the API). */
/**
 * Promotions the caller may manage. `targetType` narrows the list to one
 * domain — the park page asks for `event` so it only shows event promos.
 */
export const getPromotionsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        targetType: z.enum(["room_type", "event", "ferry_route"]).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<Promotion[]> => {
    const query = data.targetType ? `?targetType=${data.targetType}` : "";
    const res = await apiFetch(`/promotions${query}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load promotions"));
    return (await res.json()) as Promotion[];
  });

export const createPromotionServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<Promotion> => {
    const res = await apiFetch("/promotions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to create promotion"));
    return (await res.json()) as Promotion;
  });

export const updatePromotionServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    inputSchema.extend({ id: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<Promotion> => {
    const { id, ...body } = data;
    const res = await apiFetch(`/promotions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update promotion"));
    return (await res.json()) as Promotion;
  });

export const deletePromotionServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: z.number() }).parse(input))
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/promotions/${data.id}`, { method: "DELETE" });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to delete promotion"));
  });

export const getPromotionUsagesServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ id: z.number() }).parse(input))
  .handler(async ({ data }): Promise<PromotionUsage[]> => {
    const res = await apiFetch(`/promotions/${data.id}/usages`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load usages"));
    return (await res.json()) as PromotionUsage[];
  });
