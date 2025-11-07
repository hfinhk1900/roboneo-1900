type CacheValue<T> = {
  value: T;
  expiresAt: number;
};

const cacheStore = new Map<string, CacheValue<unknown>>();

function cleanup(now = Date.now()) {
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt <= now) {
      cacheStore.delete(key);
    }
  }
}

/**
 * Reads a cached value if it hasn't expired.
 */
export function getServerCache<T>(key: string): T | undefined {
  cleanup();
  const entry = cacheStore.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cacheStore.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/**
 * Stores a value with a TTL (default 30s).
 */
export function setServerCache<T>(
  key: string,
  value: T,
  ttlMs = 30 * 1000
): void {
  cleanup();
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Removes a cached key.
 */
export function deleteServerCache(key: string): void {
  cacheStore.delete(key);
}
