import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ResultCard from "../components/ResultCard";
import ResultSkeleton from "../components/ResultSkeleton";
import type { WalletAnalysis } from "../types";
import { walrusBlobUrl } from "../types";
import { fetchWalrusReport } from "../utils/api";

export default function ReportPage() {
  const { blobId } = useParams<{ blobId: string }>();
  const [analysis, setAnalysis] = useState<WalletAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blobId) return;

    fetchWalrusReport(blobId)
      .then(setAnalysis)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load report"),
      );
  }, [blobId]);

  return (
    <div className="relative z-10 mx-auto min-w-0 max-w-3xl px-4 py-28 sm:py-32">
      <Link to="/" className="text-xs text-sui-accent hover:underline font-mono mb-6 inline-block">
        ← Back to SuiSleuth
      </Link>

      {!analysis && !error && <ResultSkeleton />}

      {error && (
        <div className="glass-panel rounded-2xl p-6 text-center text-red-300">{error}</div>
      )}

      {analysis && blobId && (
        <>
          <ResultCard
            analysis={analysis}
            walrus={{
              blobId,
              shareableUrl: `${window.location.origin}/report/${blobId}`,
              aggregatorUrl: walrusBlobUrl(blobId),
            }}
          />
        </>
      )}

    </div>
  );
}
