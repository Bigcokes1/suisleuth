export type AppMode = "scan" | "compare";

export interface OGScore {
  score: number;
  label: string;
  emoji: string;
  breakdown: {
    agePoints: number;
    txPoints: number;
    earlyAdopterPoints: number;
  };
}

export interface WalletSecurity {
  flagged: boolean;
  status: "valid" | "invalid" | "unknown";
  source?: string;
  description?: string;
}

export interface WalletAnalysis {
  address: string;
  walletAge: {
    firstTransactionDate: string | null;
    daysOld: number | null;
  };
  transactionCount: number;
  transactionCountNote: string | null;
  firstActivity: {
    digest: string;
    timestamp: string | null;
    sender: string | null;
  } | null;
  fundingSource: {
    address: string | null;
    amountSui: string | null;
    transactionDigest: string | null;
  } | null;
  holdings: {
    totalObjects: number;
    coins: number;
    nfts: number;
    other: number;
    suiBalance: string | null;
  };
  security: WalletSecurity;
  ogScore: OGScore;
  analyzedAt: string;
}

export interface WalrusStorageResult {
  blobId: string;
  shareableUrl: string;
  aggregatorUrl: string;
}

export interface AnalyzeResponse {
  analysis: WalletAnalysis;
  scanId?: string;
  walrus: WalrusStorageResult | null;
  walrusFailed?: boolean;
  walrusPending?: boolean;
  cached?: boolean;
}

export interface ScanStatusResponse {
  scanId: string;
  status: "pending" | "complete" | "failed";
  walrus: WalrusStorageResult | null;
  walrusFailed?: boolean;
  walrusPending?: boolean;
}

export interface RecentLookup {
  blobId: string;
  address: string;
  ogScore: number;
  ogLabel: string;
  ogEmoji: string;
  timestamp: string;
}

export type ApiErrorCode =
  | "INVALID_ADDRESS"
  | "NO_TRANSACTIONS"
  | "RPC_TIMEOUT"
  | "RATE_LIMIT"
  | "ANALYSIS_FAILED";

export interface ApiError {
  error: string;
  code?: ApiErrorCode;
}

export interface WalletDNA {
  age: number;
  activity: number;
  diversity: number;
  ogStatus: number;
  consistency: number;
}

export const WALRUS_AGGREGATOR =
  import.meta.env.VITE_WALRUS_AGGREGATOR_URL ??
  "https://aggregator.walrus-mainnet.walrus.space/v1";

export function walrusBlobUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR}/blobs/${encodeURIComponent(blobId)}`;
}

export const APP_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "";
