import { API_URL } from "~/features/auth/api";
import type { RoomTypeImage } from "./types";

/**
 * Image operations run browser-direct rather than through a server function:
 * uploads are multipart, and routing the bytes through the SSR server just to
 * forward them again would double the transfer for no benefit. The other two
 * calls stay here so the whole Media card speaks to one client.
 *
 * The SSR helper refreshes expired access tokens for us; nothing does that on
 * the browser client, so this retries once after a 401 the same way.
 */
async function imageFetch(path: string, init: RequestInit): Promise<Response> {
  const send = () =>
    fetch(`${API_URL}${path}`, { ...init, credentials: "include" });

  const res = await send();
  if (res.status !== 401) return res;

  const refreshed = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  if (!refreshed.ok) return res; // surface the original 401

  return send();
}

async function failure(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    const message = Array.isArray(body.message)
      ? body.message[0]
      : body.message;
    return message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function uploadRoomTypeImage(
  roomTypeId: number,
  file: File,
): Promise<RoomTypeImage> {
  const body = new FormData();
  body.append("file", file);

  const res = await imageFetch(`/room-types/${roomTypeId}/images`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(await failure(res, "Failed to upload photo"));
  return (await res.json()) as RoomTypeImage;
}

export async function listRoomTypeImages(
  roomTypeId: number,
): Promise<RoomTypeImage[]> {
  const res = await imageFetch(`/room-types/${roomTypeId}/images`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(await failure(res, "Failed to load photos"));
  return (await res.json()) as RoomTypeImage[];
}

export async function setRoomTypeCoverImage(
  roomTypeId: number,
  imageId: number,
): Promise<RoomTypeImage[]> {
  const res = await imageFetch(
    `/room-types/${roomTypeId}/images/${imageId}/cover`,
    { method: "PATCH" },
  );
  if (!res.ok) throw new Error(await failure(res, "Failed to set cover"));
  return (await res.json()) as RoomTypeImage[];
}

export async function deleteRoomTypeImage(
  roomTypeId: number,
  imageId: number,
): Promise<RoomTypeImage[]> {
  const res = await imageFetch(`/room-types/${roomTypeId}/images/${imageId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await failure(res, "Failed to delete photo"));
  return (await res.json()) as RoomTypeImage[];
}
