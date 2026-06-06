import { Link } from "react-router-dom";
import type { AnalyzeResponse } from "../types";
import { truncateAddress } from "../utils/wallet";
import ResultCard from "./ResultCard";

interface CompareResultProps {
  left: AnalyzeResponse;
  right: AnalyzeResponse;
}

function winnerClass(isWinner: boolean): string {
  return isWinner ? "ring-2 ring-sui-accent shadow-glow rounded-[28px]" : "";
}

export default function CompareResult({ left, right }: CompareResultProps) {
  const leftScore = left.analysis.ogScore.score;
  const rightScore = right.analysis.ogScore.score;
  const leftWins = leftScore >= rightScore;
  const winnerSide = leftWins ? "Left" : "Right";

  const metrics = [
    {
      label: "OG Score",
      left: leftScore,
      right: rightScore,
      leftWin: leftScore > rightScore,
      rightWin: rightScore > leftScore,
    },
    {
      label: "Wallet Age (days)",
      left: left.analysis.walletAge.daysOld ?? 0,
      right: right.analysis.walletAge.daysOld ?? 0,
      leftWin: (left.analysis.walletAge.daysOld ?? 0) > (right.analysis.walletAge.daysOld ?? 0),
      rightWin: (right.analysis.walletAge.daysOld ?? 0) > (left.analysis.walletAge.daysOld ?? 0),
    },
    {
      label: "Transactions",
      left: left.analysis.transactionCount,
      right: right.analysis.transactionCount,
      leftWin: left.analysis.transactionCount > right.analysis.transactionCount,
      rightWin: right.analysis.transactionCount > left.analysis.transactionCount,
    },
  ];

  const blob1 = left.walrus?.blobId;
  const blob2 = right.walrus?.blobId;

  return (
    <div className="mt-8 space-y-8 max-w-6xl mx-auto">
      <div className="text-center glass-panel rounded-2xl py-4 px-6">
        <p className="text-lg font-semibold text-white">
          🏆 {winnerSide} wallet is the OG
        </p>
        <p className="text-sm text-white/45 mt-1">
          {leftScore} vs {rightScore} OG Score
        </p>
        {blob1 && blob2 && (
          <Link
            to={`/compare/${blob1}/${blob2}`}
            className="inline-block mt-3 text-xs text-sui-accent hover:underline font-mono"
          >
            Share comparison → /compare/{blob1.slice(0, 8)}…/{blob2.slice(0, 8)}…
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-2 mb-4">
        {metrics.map((m) => (
          <div key={m.label} className="col-span-full grid grid-cols-3 gap-2 text-center text-xs">
            <span className={`py-2 rounded-lg ${m.leftWin ? "bg-sui-accent/20 text-sui-accent font-bold" : "text-white/50"}`}>
              {m.left}
            </span>
            <span className="py-2 text-white/40 uppercase tracking-wider">{m.label}</span>
            <span className={`py-2 rounded-lg ${m.rightWin ? "bg-sui-accent/20 text-sui-accent font-bold" : "text-white/50"}`}>
              {m.right}
            </span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className={winnerClass(leftWins)}>
          <p className="text-center text-xs text-white/40 mb-2 font-mono">
            Left · {truncateAddress(left.analysis.address)}
          </p>
          <ResultCard
            analysis={left.analysis}
            walrus={left.walrus}
            walrusFailed={left.walrusFailed}
            walrusPending={left.walrusPending}
            compact
          />
        </div>
        <div className={winnerClass(!leftWins)}>
          <p className="text-center text-xs text-white/40 mb-2 font-mono">
            Right · {truncateAddress(right.analysis.address)}
          </p>
          <ResultCard
            analysis={right.analysis}
            walrus={right.walrus}
            walrusFailed={right.walrusFailed}
            walrusPending={right.walrusPending}
            compact
          />
        </div>
      </div>
    </div>
  );
}
