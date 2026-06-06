export type AppMode = "scan" | "compare";

interface ModeToggleProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex rounded-full border border-white/15 bg-black/30 p-1">
        <button
          type="button"
          onClick={() => onChange("scan")}
          className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${
            mode === "scan"
              ? "bg-sui-accent text-sui-bg"
              : "text-white/60 hover:text-white"
          }`}
        >
          🔍 Scan Wallet
        </button>
        <button
          type="button"
          onClick={() => onChange("compare")}
          className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${
            mode === "compare"
              ? "bg-sui-accent text-sui-bg"
              : "text-white/60 hover:text-white"
          }`}
        >
          ⚔️ Compare Wallets
        </button>
      </div>
    </div>
  );
}
