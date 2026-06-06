const QUICK_TAGS = [
  { label: "OG Score", hint: "Age + activity tier" },
  { label: "Funding Chain", hint: "First SUI sender" },
  { label: "On-chain Holdings", hint: "Coins & NFTs" },
];

interface WalletInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export default function WalletInput({
  value,
  onChange,
  onSubmit,
  loading,
  error,
}: WalletInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && value.trim()) {
      onSubmit();
    }
  };

  return (
    <form
      id="scan"
      onSubmit={handleSubmit}
      className="glass-search-card w-full max-w-3xl mx-auto rounded-[28px] p-5 sm:p-6"
    >
      <p className="text-sm text-white/55 mb-4 font-medium">
        Search Sui wallet
      </p>

      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/35 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
        <input
          id="wallet-address"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste wallet address (0x…)"
          spellCheck={false}
          autoComplete="off"
          disabled={loading}
          className="w-full rounded-2xl bg-black/35 border border-white/10 pl-12 pr-4 py-4 sm:py-5 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sui-accent/50 focus:ring-1 focus:ring-sui-accent/30 transition-all disabled:opacity-50"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_TAGS.map((tag) => (
          <span
            key={tag.label}
            title={tag.hint}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/75 backdrop-blur-sm"
          >
            {tag.label}
          </span>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="mt-5 w-full rounded-2xl bg-sui-accent py-3.5 text-sm font-semibold text-sui-bg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow"
      >
        {loading ? "Scanning wallet…" : "Run intelligence scan"}
      </button>

      {error && (
        <p className="mt-4 text-sm text-red-300 font-mono text-center" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
