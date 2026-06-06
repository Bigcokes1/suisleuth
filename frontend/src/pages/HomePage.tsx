import { useState } from "react";
import CompareInput from "../components/CompareInput";
import CompareResult from "../components/CompareResult";
import HeroHeadline from "../components/HeroHeadline";
import HowItWorks from "../components/HowItWorks";
import ModeToggle from "../components/ModeToggle";
import OGScoreExplained from "../components/OGScoreExplained";
import RecentLookups from "../components/RecentLookups";
import ResultCard from "../components/ResultCard";
import ResultSkeleton from "../components/ResultSkeleton";
import WalletInput from "../components/WalletInput";
import type { AnalyzeResponse, AppMode } from "../types";
import { analyzeAddress, pollWalrusStatus } from "../utils/api";

function applyWalrusStatus(
  response: AnalyzeResponse,
  status: { walrus: AnalyzeResponse["walrus"]; status: string },
): AnalyzeResponse {
  return {
    ...response,
    walrus: status.walrus,
    walrusPending: status.status === "pending",
    walrusFailed: status.status === "failed",
  };
}

async function pollWalrusForResult(
  response: AnalyzeResponse,
  onUpdate: (next: AnalyzeResponse) => void,
): Promise<void> {
  if (!response.scanId || !response.walrusPending) return;

  await pollWalrusStatus(response.scanId, (status) => {
    onUpdate(applyWalrusStatus(response, status));
  });
}

export default function HomePage() {
  const [mode, setMode] = useState<AppMode>("scan");
  const [address, setAddress] = useState("");
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [compareResult, setCompareResult] = useState<{
    left: AnalyzeResponse;
    right: AnalyzeResponse;
  } | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCompareResult(null);

    try {
      const data = await analyzeAddress(address);
      setResult(data);
      setLoading(false);
      void pollWalrusForResult(data, setResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const compare = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCompareResult(null);

    try {
      const [leftData, rightData] = await Promise.all([
        analyzeAddress(left),
        analyzeAddress(right),
      ]);
      setCompareResult({ left: leftData, right: rightData });
      setLoading(false);

      void pollWalrusForResult(leftData, (next) => {
        setCompareResult((prev) => (prev ? { ...prev, left: next } : prev));
      });
      void pollWalrusForResult(rightData, (next) => {
        setCompareResult((prev) => (prev ? { ...prev, right: next } : prev));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <>
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-8 sm:pt-32">
        <HeroHeadline />
        <ModeToggle mode={mode} onChange={setMode} />
      </section>

      <section className="px-4 pb-10 sm:pb-14">
        {mode === "scan" ? (
          <WalletInput
            value={address}
            onChange={setAddress}
            onSubmit={analyze}
            loading={loading}
            error={error}
          />
        ) : (
          <CompareInput
            left={left}
            right={right}
            onLeftChange={setLeft}
            onRightChange={setRight}
            onSubmit={compare}
            loading={loading}
            error={error}
          />
        )}

        {loading && <ResultSkeleton />}

        {mode === "scan" && result && !loading && (
          <div className="mt-8 max-w-3xl mx-auto">
            <ResultCard
              analysis={result.analysis}
              walrus={result.walrus}
              walrusFailed={result.walrusFailed}
              walrusPending={result.walrusPending}
            />
          </div>
        )}

        {mode === "compare" && compareResult && !loading && (
          <CompareResult left={compareResult.left} right={compareResult.right} />
        )}
      </section>

      <HowItWorks />
      <RecentLookups />
      <OGScoreExplained />
    </>
  );
}
