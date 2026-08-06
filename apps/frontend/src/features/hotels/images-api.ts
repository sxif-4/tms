import {
  browserFetch as imageFetch,
  failureMessage as failure,
} from "~/lib/browser-api";
import type { RoomTypeImage } from "./types";

/**
 * Hotels, room types and events all expose the same `/images` sub-resource
 * (the API side is one polymorphic `imageables` table), so the four calls are
 * written once against an owner and re-exported per owner below.
 *
 * This module predates the event gallery and still lives under `hotels/`; the
 * park imports from it rather than cloning the fetch/refresh handling.
 */
type ImageOwner = "room-types" | "hotels" | "events";

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

export const uploadEventImage = (eventId: number, file: File) =>
  uploadImage("events", eventId, file);

export const listEventImages = (eventId: number) =>
  listImages("events", eventId);

export const setEventCoverImage = (eventId: number, imageId: number) =>
  setCoverImage("events", eventId, imageId);

export const deleteEventImage = (eventId: number, imageId: number) =>
  deleteImage("events", eventId, imageId);
