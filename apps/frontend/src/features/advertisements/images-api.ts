import { browserFetch, failureMessage } from "~/lib/browser-api";

/**
 * Uploads a creative and returns its public URL, which the caller submits as
 * `image` when creating or updating the ad.
 *
 * Unlike hotels/room-types/events, ads don't own a gallery — the schema keeps a
 * single denormalized `image` URL — so there is no `/images` sub-resource here,
 * just a place to put the file.
 */
export async function uploadAdvertisementImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const res = await browserFetch("/advertisements/image", {
    method: "POST",
    body,
  });
  if (!res.ok) {
    throw new Error(await failureMessage(res, "Failed to upload image"));
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}
