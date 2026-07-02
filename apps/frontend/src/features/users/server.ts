import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type { User } from "../auth/types";

/** Lists every user (admin-only on the API). */
export const getUsersServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<User[]> => {
    const res = await apiFetch("/users");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load users"));
    return (await res.json()) as User[];
  },
);

const updateUserRoleSchema = z.object({
  id: z.number().int().positive(),
  role: z.enum(["visitor", "hotel_staff", "ferry_staff", "park_staff", "admin"]),
});

/** Reassigns a user to a different role (admin-only on the API). */
export const updateUserRoleServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateUserRoleSchema.parse(input))
  .handler(async ({ data }): Promise<User> => {
    const res = await apiFetch(`/users/${data.id}/role`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: data.role }),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update role"));
    return (await res.json()) as User;
  });

const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  // `admin` is excluded — the API rejects it too (single-admin invariant).
  role: z.enum(["visitor", "hotel_staff", "ferry_staff", "park_staff"]),
  phone: z.string().trim().max(30).optional(),
});

export interface StaffCreated {
  user: User;
  temporaryPassword: string;
}

/** Creates a staff/visitor account; returns the one-time password (admin-only). */
export const createStaffServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createStaffSchema.parse(input))
  .handler(async ({ data }): Promise<StaffCreated> => {
    const res = await apiFetch("/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to create account"));
    return (await res.json()) as StaffCreated;
  });

const setUserActiveSchema = z.object({
  id: z.number().int().positive(),
  isActive: z.boolean(),
});

/** Activates or deactivates a user account (admin-only on the API). */
export const setUserActiveServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => setUserActiveSchema.parse(input))
  .handler(async ({ data }): Promise<User> => {
    const action = data.isActive ? "activate" : "deactivate";
    const res = await apiFetch(`/users/${data.id}/${action}`, {
      method: "PATCH",
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update status"));
    return (await res.json()) as User;
  });
