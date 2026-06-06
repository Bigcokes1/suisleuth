import type { WalletAnalysis, WalletDNA } from "../types";

export function computeWalletDNA(analysis: WalletAnalysis): WalletDNA {
  const daysOld = analysis.walletAge.daysOld ?? 0;
  const txCount = analysis.transactionCount;
  const typeCount =
    (analysis.holdings.coins > 0 ? 1 : 0) +
    (analysis.holdings.nfts > 0 ? 1 : 0) +
    (analysis.holdings.other > 0 ? 1 : 0);
  const objectTypes = analysis.holdings.coins + analysis.holdings.nfts + analysis.holdings.other;

  const age = Math.min(100, Math.round((daysOld / 1095) * 100));
  const activity = Math.min(
    100,
    txCount >= 1000 ? 100 : txCount >= 500 ? 80 : txCount >= 100 ? 60 : txCount >= 10 ? 35 : 15,
  );
  const diversity = Math.min(
    100,
    Math.round((Math.max(typeCount, Math.min(objectTypes, 20)) / 20) * 100),
  );
  const ogStatus = analysis.ogScore.breakdown.earlyAdopterPoints > 0 ? 100 : 0;

  const txsPerDay = daysOld > 0 ? txCount / daysOld : txCount;
  const consistency = Math.min(100, Math.round(Math.min(txsPerDay * 30, 1) * 100));

  return { age, activity, diversity, ogStatus, consistency };
}

export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (addr.length <= start + end + 2) return addr;
  return `${addr.slice(0, start + 2)}…${addr.slice(-end)}`;
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
