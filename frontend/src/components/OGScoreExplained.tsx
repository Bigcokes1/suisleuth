const BADGE_TIERS = [
  { emoji: "🏆", label: "OG Whale", range: "80–100" },
  { emoji: "💎", label: "Diamond Hands", range: "60–79" },
  { emoji: "🔥", label: "Degen Veteran", range: "40–59" },
  { emoji: "📈", label: "Early Mover", range: "20–39" },
  { emoji: "🌱", label: "Newcomer", range: "0–19" },
];

export default function OGScoreExplained() {
  return (
    <section className="max-w-4xl mx-auto px-4 pb-8 sm:pb-10">
      <div className="glass-panel rounded-[24px] p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
          What is the OG Score?
        </h2>
        <p className="text-sm text-white/55 leading-relaxed mb-8">
          The OG Score is a 0–100 rating that measures how early and active a
          wallet has been on Sui. It factors in wallet age, transaction count,
          and early adopter status. The earlier and more active, the higher the
          score.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {BADGE_TIERS.map((tier) => (
            <div
              key={tier.label}
              className="rounded-xl border border-white/10 bg-black/25 px-4 py-4 text-center"
            >
              <div className="text-2xl mb-2" aria-hidden>
                {tier.label === "Early Mover" ? "📈" : tier.emoji}
              </div>
              <p className="text-sm font-medium text-white">{tier.label}</p>
              <p className="text-xs font-mono text-sui-accent mt-1">
                {tier.range}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
