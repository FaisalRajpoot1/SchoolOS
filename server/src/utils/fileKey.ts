import { extname } from 'node:path';

/** File extensions accepted for upload (lower-case, dot-prefixed). */
const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
  '.csv',
]);

/**
 * Returns the lower-cased extension of a filename if it is on the allow-list,
 * else an empty string. Pure and env-free. Rejects path tricks implicitly:
 * `extname` only reads the final path segment's suffix.
 */
export const safeExtension = (originalName: string): string => {
  const ext = extname(originalName).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) ? ext : '';
};

/**
 * Builds a flat, path-safe storage key from a server-generated id and the
 * original filename's (allow-listed) extension. The id must contain no path
 * separators (a uuid does not), so the key can never escape the storage root.
 */
export const buildStorageKey = (id: string, originalName: string): string =>
  `${id}${safeExtension(originalName)}`;

/** Canonical MIME type per allow-listed extension. */
const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
};

/**
 * Server-trusted MIME type derived from the (already validated) extension —
 * never from the client-supplied part header. Unknown extensions fall back to a
 * generic binary type so a spoofed content type can never be echoed on download.
 */
export const mimeForExtension = (ext: string): string =>
  MIME_BY_EXTENSION[ext.toLowerCase()] ?? 'application/octet-stream';

/** Reduces a filename to a header-safe ASCII subset (blocks CR/LF/quote injection). */
export const safeDownloadName = (name: string): string =>
  name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100) || 'download';
