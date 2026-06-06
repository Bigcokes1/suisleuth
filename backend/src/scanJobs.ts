import { randomUUID } from "node:crypto";
import { addRecentLookup } from "./recentLookups.js";
import type { WalletAnalysis } from "./sui.js";
import { storeAnalysisOnWalrus, type WalrusStorageResult } from "./walrus.js";
import { updateCachedWalrus } from "./analysisCache.js";

export type ScanStatus = "pending" | "complete" | "failed";

export interface ScanJob {
  scanId: string;
  address: string;
  status: ScanStatus;
  walrus: WalrusStorageResult | null;
  createdAt: number;
}

const JOB_TTL_MS = 60 * 60 * 1000;
const jobs = new Map<string, ScanJob>();

function pruneOldJobs(): void {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) {
      jobs.delete(id);
    }
  }
}

export function getScanJob(scanId: string): ScanJob | null {
  return jobs.get(scanId) ?? null;
}

export function startBackgroundWalrusUpload(
  address: string,
  analysis: WalletAnalysis,
): string {
  pruneOldJobs();

  const scanId = randomUUID();
  jobs.set(scanId, {
    scanId,
    address,
    status: "pending",
    walrus: null,
    createdAt: Date.now(),
  });

  void storeAnalysisOnWalrus(analysis)
    .then((walrus) => {
      const job = jobs.get(scanId);
      if (!job) return;

      if (walrus) {
        job.status = "complete";
        job.walrus = walrus;
        addRecentLookup(walrus.blobId, analysis);
        updateCachedWalrus(address, walrus);
      } else {
        job.status = "failed";
      }
    })
    .catch(() => {
      const job = jobs.get(scanId);
      if (job) job.status = "failed";
    });

  return scanId;
}
