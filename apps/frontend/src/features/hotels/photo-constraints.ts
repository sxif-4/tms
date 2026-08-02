/** Mirrors the API's own limits so a bad file never leaves the browser. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

/** Returns a human-readable reason, or null when the file is acceptable. */
export function imageRejectionReason(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as never)) {
    return `${file.name} isn't a JPG, PNG or WEBP`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name} is larger than 5 MB`;
  }
  return null;
}
