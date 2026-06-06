import type { WalletAnalysis } from "./sui.js";

const WALRUS_AGGREGATOR_BASE =
  process.env.WALRUS_AGGREGATOR_URL ??
  "https://aggregator.walrus-mainnet.walrus.space/v1";

export function walrusBlobUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR_BASE}/blobs/${encodeURIComponent(blobId)}`;
}

export async function fetchWalrusBlob(blobId: string): Promise<WalletAnalysis> {
  const response = await fetch(walrusBlobUrl(blobId));
  if (!response.ok) {
    throw new Error(`Walrus aggregator returned HTTP ${response.status}`);
  }

  const text = await response.text();
  const json = JSON.parse(text) as WalletAnalysis & {
    app?: string;
    version?: number;
  };

  return {
    ...json,
    security: json.security ?? { flagged: false, status: "unknown" },
  };
}
