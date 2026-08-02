import { useCallback, useEffect, useRef, useState } from "react";

export interface StagedPhoto {
  /** Local-only key; the real image id doesn't exist until upload. */
  key: string;
  file: File;
  previewUrl: string;
}

/**
 * Holds photos chosen while a room type is still being created, so the whole
 * thing can be saved in one go. Object URLs are revoked on removal and on
 * unmount to avoid leaking blobs.
 */
export function useStagedPhotos() {
  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [preferredCoverKey, setPreferredCoverKey] = useState<string | null>(
    null,
  );

  // Revoke every outstanding preview when the form goes away.
  const urlsRef = useRef<string[]>([]);
  urlsRef.current = photos.map((p) => p.previewUrl);
  useEffect(
    () => () => urlsRef.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );

  const add = useCallback((files: File[]) => {
    const staged = files.map((file) => ({
      key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((current) => [...current, ...staged]);
  }, []);

  const remove = useCallback((key: string) => {
    setPhotos((current) => {
      const target = current.find((p) => p.key === key);
      // Safe inside the updater: revoking an already-revoked URL is a no-op,
      // so a double invocation in StrictMode can't do damage.
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((p) => p.key !== key);
    });
  }, []);

  const clear = useCallback(() => {
    setPhotos((current) => {
      current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    setPreferredCoverKey(null);
  }, []);

  /**
   * Derived rather than stored, so removing the chosen cover falls back to the
   * first remaining photo without the two pieces of state drifting apart.
   */
  const coverKey =
    photos.find((p) => p.key === preferredCoverKey)?.key ??
    photos[0]?.key ??
    null;

  return {
    photos,
    coverKey,
    setCoverKey: setPreferredCoverKey,
    add,
    remove,
    clear,
  };
}
