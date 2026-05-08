/**
 * Permanent Local Store (PLS) — Phone-first Cache System
 *
 * Data is stored permanently in localStorage on the user's phone.
 * The app NEVER fetches from the database unless:
 *   1. First time (no cache exists yet)
 *   2. Admin creates / updates / deletes data (cache is invalidated)
 *   3. App version changes (all caches are wiped)
 *
 * User-specific data (watchlist, watch history, favorites) is NOT cached
 * here — those always fetch fresh because they are per-user.
 */

// App version — bump this string when you release a new app version
// to force all users to re-fetch fresh data.
// UPDATED to v3.2.9: Forces all users to clear old cache and re-fetch
// fresh data from the new Supabase database.
const APP_VERSION = 'v3.2.9';
const STORE_PREFIX = 'pls:';
const VERSION_KEY = 'pls:__version__';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoreEntry<T> {
  data: T;
  savedAt: number;   // unix ms — when it was last fetched from DB
  version: string;   // app version at save time
}

// ─── Version Guard ────────────────────────────────────────────────────────────

/**
 * On first load, if the stored app version doesn't match the current one,
 * wipe all permanent cache entries so users get fresh data after an update.
 */
export function initPermanentStore(): void {
  try {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored !== APP_VERSION) {
      clearAllPermanentStore();
      localStorage.setItem(VERSION_KEY, APP_VERSION);
    }
  } catch {
    // silent
  }
}

// ─── Core Read / Write ────────────────────────────────────────────────────────

/**
 * Read a value from permanent store.
 * Returns null only if the key doesn't exist or version mismatch.
 */
export function getStored<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${STORE_PREFIX}${key}`);
    if (!raw) return null;
    const entry: StoreEntry<T> = JSON.parse(raw);
    if (entry.version !== APP_VERSION) {
      localStorage.removeItem(`${STORE_PREFIX}${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Write a value to permanent store (no expiry).
 */
export function setStored<T>(key: string, data: T): void {
  try {
    const entry: StoreEntry<T> = {
      data,
      savedAt: Date.now(),
      version: APP_VERSION,
    };
    const serialized = JSON.stringify(entry);
    // If single entry > 4MB, skip (too large for localStorage)
    if (serialized.length > 4 * 1024 * 1024) {
      console.warn(`[PLS] Skipping "${key}" — too large (${Math.round(serialized.length / 1024)}KB)`);
      return;
    }
    localStorage.setItem(`${STORE_PREFIX}${key}`, serialized);
  } catch {
    // localStorage full — evict oldest entries and retry once
    evictOldest();
    try {
      const entry: StoreEntry<T> = { data, savedAt: Date.now(), version: APP_VERSION };
      localStorage.setItem(`${STORE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
      // silent — caching is best-effort
    }
  }
}

// ─── Invalidation ─────────────────────────────────────────────────────────────

/** Remove a single key from permanent store. */
export function invalidateStore(key: string): void {
  localStorage.removeItem(`${STORE_PREFIX}${key}`);
}

/** Remove all keys that start with a given prefix. */
export function invalidateStoreByPrefix(prefix: string): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`${STORE_PREFIX}${prefix}`)) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
}

/** Wipe ALL permanent store entries. */
export function clearAllPermanentStore(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORE_PREFIX)) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
}

// ─── React-Query Helper ───────────────────────────────────────────────────────

/**
 * Wrap a React Query queryFn with permanent-store-first logic.
 * If data exists in localStorage → return it immediately (no DB call).
 * If not → fetch from DB, save to localStorage, return.
 */
export function withPermanentCache<T>(
  storeKey: string,
  fetcher: () => Promise<T>
): () => Promise<T> {
  return async () => {
    const stored = getStored<T>(storeKey);
    if (stored !== null) {
      return stored;
    }
    const data = await fetcher();
    setStored(storeKey, data);
    return data;
  };
}

// ─── Stats (for CacheStatusPanel) ────────────────────────────────────────────

export interface StoreEntryInfo {
  key: string;
  savedAt: number;
  sizeKB: number;
}

export function getPermanentStoreStats(): {
  totalEntries: number;
  totalSizeKB: number;
  entries: StoreEntryInfo[];
} {
  const entries: StoreEntryInfo[] = [];
  let totalSize = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORE_PREFIX) && k !== VERSION_KEY) {
      try {
        const raw = localStorage.getItem(k)!;
        const entry: StoreEntry<unknown> = JSON.parse(raw);
        const sizeKB = Math.round((raw.length / 1024) * 10) / 10;
        totalSize += raw.length;
        entries.push({
          key: k.replace(STORE_PREFIX, ''),
          savedAt: entry.savedAt,
          sizeKB,
        });
      } catch {
        // skip malformed
      }
    }
  }

  return {
    totalEntries: entries.length,
    totalSizeKB: Math.round((totalSize / 1024) * 10) / 10,
    entries: entries.sort((a, b) => b.sizeKB - a.sizeKB),
  };
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function evictOldest(): void {
  const entries: { key: string; savedAt: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORE_PREFIX)) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const entry = JSON.parse(raw);
          entries.push({ key: k, savedAt: entry.savedAt || 0 });
        }
      } catch {
        entries.push({ key: k!, savedAt: 0 });
      }
    }
  }
  entries.sort((a, b) => a.savedAt - b.savedAt);
  entries.slice(0, Math.ceil(entries.length / 2)).forEach(e => localStorage.removeItem(e.key));
}

// ─── Legacy aliases (keep old names working during transition) ────────────────
// These map old TTL-based API to permanent store so we don't break any
// existing code that still imports from cache.ts

/** @deprecated Use withPermanentCache instead */
export function withCache<T>(
  cacheKey: string,
  _ttl: number,
  fetcher: () => Promise<T>
): () => Promise<T> {
  return withPermanentCache(cacheKey, fetcher);
}

/** @deprecated Use invalidateStore instead */
export function invalidateCache(key: string): void {
  invalidateStore(key);
}

/** @deprecated Use invalidateStoreByPrefix instead */
export function invalidateCacheByPrefix(prefix: string): void {
  invalidateStoreByPrefix(prefix);
}

/** @deprecated Use clearAllPermanentStore instead */
export function clearAllCache(): void {
  clearAllPermanentStore();
}

/** @deprecated Use getPermanentStoreStats instead */
export function getCacheStats() {
  const stats = getPermanentStoreStats();
  return {
    totalEntries: stats.totalEntries,
    totalSizeKB: stats.totalSizeKB,
    entries: stats.entries.map(e => ({
      key: e.key,
      ageMinutes: Math.round((Date.now() - e.savedAt) / 60000),
      ttlMinutes: 0,  // permanent — no TTL
      sizeKB: e.sizeKB,
    })),
  };
}

// Keep CACHE_TTL exported so existing imports don't break
// (values are ignored — everything is permanent now)
export const CACHE_TTL = {
  MOVIES: 0,
  MOVIE_DETAIL: 0,
  FEATURED: 0,
  TRENDING: 0,
  CATEGORIES: 0,
  SITE_SETTINGS: 0,
  INFO_SLIDES: 0,
  SEASONS: 0,
  RECOMMENDATIONS: 0,
  CAST: 0,
  PRICING: 0,
  PAYMENT_METHODS: 0,
  LIVE_TV_SOURCES: 0,
  LIVE_TV_CHANNELS: 0,
  BROKEN_CHANNELS: 0,
  DIRECT_CHANNELS: 0,
  FOOTBALL: 0,
  USER_DATA: 0,
  WATCH_HISTORY: 0,
} as const;
