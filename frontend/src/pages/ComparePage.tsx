import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CompareResult from "../components/CompareResult";
import ResultSkeleton from "../components/ResultSkeleton";
import type { AnalyzeResponse, WalletAnalysis } from "../types";
import { walrusBlobUrl } from "../types";
import { fetchWalrusReport } from "../utils/api";

function toAnalyzeResponse(
  analysis: WalletAnalysis,
  blobId: string,
): AnalyzeResponse {
  return {
    analysis,
    walrus: {
      blobId,
      shareableUrl: `${window.location.origin}/report/${blobId}`,
      aggregatorUrl: walrusBlobUrl(blobId),
    },
  };
}

export default function ComparePage() {
  const { blobId1, blobId2 } = useParams<{ blobId1: string; blobId2: string }>();
  const [left, setLeft] = useState<AnalyzeResponse | null>(null);
  const [right, setRight] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blobId1 || !blobId2) return;

    Promise.all([fetchWalrusReport(blobId1), fetchWalrusReport(blobId2)])
      .then(([a, b]) => {
        setLeft(toAnalyzeResponse(a, blobId1));
        setRight(toAnalyzeResponse(b, blobId2));
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load comparison"),
      );
  }, [blobId1, blobId2]);

  return (
    <div className="relative z-10 px-4 py-28 sm:py-32 max-w-6xl mx-auto">
      <Link to="/" className="text-xs text-sui-accent hover:underline font-mono mb-6 inline-block">
        ← Back to SuiSleuth
      </Link>

      <h1 className="text-2xl font-semibold text-white text-center mb-8">
        ⚔️ Wallet Comparison
      </h1>

      {(!left || !right) && !error && <ResultSkeleton />}

      {error && (
        <div className="glass-panel rounded-2xl p-6 text-center text-red-300">{error}</div>
      )}

      {left && right && <CompareResult left={left} right={right} />}
    </div>
  );
}
