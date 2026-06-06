import type { OGScore } from "../types";

interface OGBadgeProps {
  ogScore: OGScore;
}

export default function OGBadge({ ogScore }: OGBadgeProps) {
  return (
    <div className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
      <div className="relative w-28 h-28 rounded-full p-[2px] bg-gradient-to-br from-sui-accent to-blue-300 shadow-glow-lg">
        <div className="w-full h-full rounded-full bg-sui-bg/90 flex flex-col items-center justify-center border border-white/10">
          <span className="text-3xl font-bold text-white tabular-nums">
            {ogScore.score}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-white/45">
            OG Score
          </span>
        </div>
      </div>
      <div className="w-full min-w-0 text-center">
        <p className="text-lg font-semibold text-white">
          {ogScore.label === "Early Mover" ? (
            <>📈 Early Mover</>
          ) : (
            <>
              {ogScore.emoji} {ogScore.label}
            </>
          )}
        </p>
        <div className="mt-2 flex w-full min-w-0 flex-wrap justify-center gap-1.5 text-[10px] font-mono text-white/45 sm:gap-2 sm:text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            Age +{ogScore.breakdown.agePoints}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            TX +{ogScore.breakdown.txPoints}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            Early +{ogScore.breakdown.earlyAdopterPoints}
          </span>
        </div>
      </div>
    </div>
  );
}
