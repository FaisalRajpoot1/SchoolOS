import { extname } from 'node:path';

/** Image extensions accepted for photos/logos (lower-case, dot-prefixed). */
const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

/**
 * Returns the lower-cased extension of a filename if it is an allowed image
 * type, else an empty string. Pure and env-free. `extname` only reads the final
 * segment's suffix, so path tricks cannot slip through.
 */
export const imageExtension = (originalName: string): string => {
  const ext = extname(originalName).toLowerCase();
  return ext in IMAGE_MIME_BY_EXTENSION ? ext : '';
};

/** Server-trusted image MIME type derived from an allowed extension. */
export const imageMime = (ext: string): string =>
  IMAGE_MIME_BY_EXTENSION[ext.toLowerCase()] ?? 'application/octet-stream';

/**
 * Builds a flat, path-safe storage key from a server-generated id and an image
 * extension. The id (a uuid) has no path separators, so the key can never
 * escape the storage root.
 */
export const buildImageKey = (id: string, ext: string): string => `${id}${ext}`;
