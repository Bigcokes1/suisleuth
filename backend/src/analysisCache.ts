import type { WalletAnalysis } from "./sui.js";
import type { WalrusStorageResult } from "./walrus.js";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  analysis: WalletAnalysis;
  walrus: WalrusStorageResult | null;
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(address: string): string {
  return address.toLowerCase();
}

export function getCachedAnalysis(address: string): CacheEntry | null {
  const entry = cache.get(cacheKey(address));
  if (!entry) return null;

  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(cacheKey(address));
    return null;
  }

  return entry;
}

export function setCachedAnalysis(
  address: string,
  analysis: WalletAnalysis,
  walrus: WalrusStorageResult | null = null,
): void {
  cache.set(cacheKey(address), {
    analysis,
    walrus,
    cachedAt: Date.now(),
  });
}

export function updateCachedWalrus(
  address: string,
  walrus: WalrusStorageResult,
): void {
  const entry = cache.get(cacheKey(address));
  if (entry) {
    entry.walrus = walrus;
  }
}
