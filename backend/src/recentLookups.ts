import type { WalletAnalysis } from "./sui.js";

export interface RecentLookup {
  blobId: string;
  address: string;
  ogScore: number;
  ogLabel: string;
  ogEmoji: string;
  timestamp: string;
}

const MAX_RECENT = 10;
const recentLookups: RecentLookup[] = [];

export function addRecentLookup(
  blobId: string,
  analysis: WalletAnalysis,
): void {
  const entry: RecentLookup = {
    blobId,
    address: analysis.address,
    ogScore: analysis.ogScore.score,
    ogLabel: analysis.ogScore.label,
    ogEmoji: analysis.ogScore.emoji,
    timestamp: new Date().toISOString(),
  };

  recentLookups.unshift(entry);
  if (recentLookups.length > MAX_RECENT) {
    recentLookups.length = MAX_RECENT;
  }
}

export function getRecentLookups(): RecentLookup[] {
  return [...recentLookups];
}
