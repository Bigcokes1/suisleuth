interface CompareInputProps {
  left: string;
  right: string;
  onLeftChange: (v: string) => void;
  onRightChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export default function CompareInput({
  left,
  right,
  onLeftChange,
  onRightChange,
  onSubmit,
  loading,
  error,
}: CompareInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && left.trim() && right.trim()) onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-search-card w-full max-w-4xl mx-auto rounded-[28px] p-5 sm:p-6"
    >
      <p className="text-sm text-white/55 mb-4 font-medium">Compare two Sui wallets</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={left}
          onChange={(e) => onLeftChange(e.target.value)}
          placeholder="Wallet A (0x…)"
          spellCheck={false}
          disabled={loading}
          className="w-full rounded-2xl bg-black/35 border border-white/10 px-4 py-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sui-accent/50"
        />
        <input
          type="text"
          value={right}
          onChange={(e) => onRightChange(e.target.value)}
          placeholder="Wallet B (0x…)"
          spellCheck={false}
          disabled={loading}
          className="w-full rounded-2xl bg-black/35 border border-white/10 px-4 py-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sui-accent/50"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !left.trim() || !right.trim()}
        className="mt-5 w-full rounded-2xl bg-sui-accent py-3.5 text-sm font-semibold text-sui-bg hover:brightness-110 disabled:opacity-40 transition-all"
      >
        {loading ? "Comparing…" : "⚔️ Compare Wallets"}
      </button>
      {error && (
        <p className="mt-4 text-sm text-red-300 font-mono text-center" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
