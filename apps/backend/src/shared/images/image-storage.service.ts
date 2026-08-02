import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

/** Public URL prefix; must match the static mount in `main.ts`. */
export const UPLOADS_URL_PREFIX = '/uploads';

/** On-disk location, relative to the backend's working directory. */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Writes uploaded images to local disk. Deliberately the only place that knows
 * where files live, so swapping in object storage later is a one-file change.
 */
@Injectable()
export class ImageStorageService {
  private readonly logger = new Logger(ImageStorageService.name);

  constructor() {
    this.ensureDir();
  }

  /** Saves the buffer under a random name and returns its public URL path. */
  save(file: Express.Multer.File): string {
    // Re-checked per write, not just at boot: the directory is gitignored and
    // can be wiped (fresh clone, cleanup, container restart) while the process
    // is still alive, which would otherwise fail every upload with ENOENT.
    this.ensureDir();

    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    writeFileSync(join(UPLOADS_DIR, filename), file.buffer);
    return `${UPLOADS_URL_PREFIX}/${filename}`;
  }

  private ensureDir(): void {
    if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  /**
   * Removes a previously saved file. Seeded images are remote URLs and are
   * skipped. Never throws — an orphaned file must not fail the request.
   */
  remove(url: string): void {
    if (!url.startsWith(`${UPLOADS_URL_PREFIX}/`)) return;
    const filename = url.slice(UPLOADS_URL_PREFIX.length + 1);
    // Defend against a stored path trying to escape the uploads directory.
    if (filename.includes('/') || filename.includes('..')) return;
    try {
      unlinkSync(join(UPLOADS_DIR, filename));
    } catch (err) {
      this.logger.warn(
        `Could not delete upload ${filename}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
