const STEPS = [
  {
    icon: "🔍",
    title: "Enter a Sui Wallet",
    text: "Paste any Sui wallet address to begin. SuiSleuth works on any public address on Sui Mainnet.",
  },
  {
    icon: "⚡",
    title: "Powered by Tatum RPC",
    text: "We query Sui Mainnet in real time via Tatum's enterprise-grade RPC nodes — fetching transaction history, wallet age, funding source, and object holdings.",
  },
  {
    icon: "🦭",
    title: "Results Live Forever",
    text: "Every analysis is stored as a permanent blob on Walrus decentralized storage. Your report gets a shareable link that lives on-chain — no servers, no expiry.",
  },
];

function StepArrow() {
  return (
    <div
      className="hidden lg:flex items-center justify-center shrink-0 text-sui-accent/40 px-1"
      aria-hidden
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
      <div className="text-center mb-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-sui-accent font-semibold mb-2">
          Process
        </p>
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">
          How It Works
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-2">
        {STEPS.map((step, index) => (
          <div key={step.title} className="contents">
            <article className="glass-panel flex-1 rounded-[24px] p-6 sm:p-7">
              <div className="text-3xl mb-4" aria-hidden>
                {step.icon}
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-sui-accent font-semibold mb-2">
                Step {index + 1}
              </p>
              <h3 className="text-lg font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-white/55 leading-relaxed">
                {step.text}
              </p>
            </article>
            {index < STEPS.length - 1 && <StepArrow />}
          </div>
        ))}
      </div>
    </section>
  );
}
