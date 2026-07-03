import { useEffect, useState } from 'react';
import { api } from './axios';

// Process-wide cache of object URLs keyed by `src::version`, so remounting a
// component (e.g. paging back to a student list) reuses the blob instead of
// refetching. At most one URL is kept per `src`: bumping the version revokes the
// previous one, keeping the cache bounded by the number of distinct images seen.
const cache = new Map<string, string>();
const keyFor = (src: string, version?: string | number): string => `${src}::${version ?? ''}`;

const revokeOtherVersions = (src: string, keepKey: string): void => {
  const prefix = `${src}::`;
  for (const [k, url] of cache) {
    if (k.startsWith(prefix) && k !== keepKey) {
      URL.revokeObjectURL(url);
      cache.delete(k);
    }
  }
};

/**
 * Fetches an authenticated image/blob (via the API interceptor) and exposes it
 * as a cached object URL. Returns null while loading, when disabled, or on
 * error. Pass a changing `version` to force a re-fetch after the image changes.
 */
export const useObjectUrl = (
  src: string,
  enabled: boolean,
  version?: string | number,
): string | null => {
  const key = keyFor(src, version);
  const [url, setUrl] = useState<string | null>(() => (enabled ? (cache.get(key) ?? null) : null));

  useEffect(() => {
    if (!enabled) {
      setUrl(null);
      return;
    }
    const cached = cache.get(key);
    if (cached) {
      setUrl(cached);
      return;
    }
    let active = true;
    api
      .get(src, { responseType: 'blob' })
      .then((res) => {
        if (!active) return;
        const objectUrl = URL.createObjectURL(res.data as Blob);
        revokeOtherVersions(src, key);
        cache.set(key, objectUrl);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setUrl(null);
      });
    return () => {
      active = false;
    };
  }, [key, src, enabled]);

  return url;
};
