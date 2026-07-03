import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { env } from '@/config/env';

/**
 * A pluggable binary store. The local implementation writes under UPLOAD_DIR;
 * swap in an S3/GCS-backed class later without touching callers.
 */
export interface FileStorage {
  save(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

const BASE_DIR = resolve(env.UPLOAD_DIR);

/** Resolves a key under the storage root, refusing any path that escapes it. */
const resolveKey = (key: string): string => {
  const target = resolve(BASE_DIR, key);
  if (target !== BASE_DIR && !target.startsWith(BASE_DIR + sep)) {
    throw new Error('Invalid storage key');
  }
  return target;
};

class LocalFileStorage implements FileStorage {
  async save(key: string, data: Buffer): Promise<void> {
    const path = resolveKey(key);
    await mkdir(BASE_DIR, { recursive: true });
    await writeFile(path, data);
  }

  read(key: string): Promise<Buffer> {
    return readFile(resolveKey(key));
  }

  async remove(key: string): Promise<void> {
    // A missing file is not an error (the metadata row is the source of truth).
    await unlink(resolveKey(key)).catch(() => undefined);
  }
}

export const fileStorage: FileStorage = new LocalFileStorage();
