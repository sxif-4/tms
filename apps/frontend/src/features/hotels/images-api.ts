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

/**
 * Both hotels and room types expose the same `/images` sub-resource (the API
 * side is one polymorphic `imageables` table), so the four calls are written
 * once against an owner and re-exported per owner below.
 */
type ImageOwner = "room-types" | "hotels";

async function uploadImage(
  owner: ImageOwner,
  ownerId: number,
  file: File,
): Promise<RoomTypeImage> {
  const body = new FormData();
  body.append("file", file);

  const res = await imageFetch(`/${owner}/${ownerId}/images`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(await failure(res, "Failed to upload photo"));
  return (await res.json()) as RoomTypeImage;
}

async function listImages(
  owner: ImageOwner,
  ownerId: number,
): Promise<RoomTypeImage[]> {
  const res = await imageFetch(`/${owner}/${ownerId}/images`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(await failure(res, "Failed to load photos"));
  return (await res.json()) as RoomTypeImage[];
}

async function setCoverImage(
  owner: ImageOwner,
  ownerId: number,
  imageId: number,
): Promise<RoomTypeImage[]> {
  const res = await imageFetch(`/${owner}/${ownerId}/images/${imageId}/cover`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error(await failure(res, "Failed to set cover"));
  return (await res.json()) as RoomTypeImage[];
}

async function deleteImage(
  owner: ImageOwner,
  ownerId: number,
  imageId: number,
): Promise<RoomTypeImage[]> {
  const res = await imageFetch(`/${owner}/${ownerId}/images/${imageId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await failure(res, "Failed to delete photo"));
  return (await res.json()) as RoomTypeImage[];
}

export const uploadRoomTypeImage = (roomTypeId: number, file: File) =>
  uploadImage("room-types", roomTypeId, file);

export const listRoomTypeImages = (roomTypeId: number) =>
  listImages("room-types", roomTypeId);

export const setRoomTypeCoverImage = (roomTypeId: number, imageId: number) =>
  setCoverImage("room-types", roomTypeId, imageId);

export const deleteRoomTypeImage = (roomTypeId: number, imageId: number) =>
  deleteImage("room-types", roomTypeId, imageId);

export const uploadHotelImage = (hotelId: number, file: File) =>
  uploadImage("hotels", hotelId, file);

export const listHotelImages = (hotelId: number) =>
  listImages("hotels", hotelId);

export const setHotelCoverImage = (hotelId: number, imageId: number) =>
  setCoverImage("hotels", hotelId, imageId);

export const deleteHotelImage = (hotelId: number, imageId: number) =>
  deleteImage("hotels", hotelId, imageId);
