interface VerifiedBadgesProps {
  walrusStored?: boolean;
}

const containerStyle = {
  display: "flex",
  flexDirection: "row" as const,
  gap: "8px",
  justifyContent: "center",
  flexWrap: "wrap" as const,
};

const badgeStyle = {
  whiteSpace: "nowrap" as const,
  fontSize: "11px",
  padding: "4px 10px",
};

export default function VerifiedBadges({ walrusStored = false }: VerifiedBadgesProps) {
  return (
    <div className="mb-6" style={containerStyle}>
      <span
        style={badgeStyle}
        className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/15 font-semibold uppercase tracking-wide text-blue-300"
      >
        ✅ Verified on Sui Mainnet
      </span>
      {walrusStored && (
        <span
          style={badgeStyle}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 font-semibold uppercase tracking-wide text-emerald-300"
        >
          🦭 Stored on Walrus
        </span>
      )}
      <span
        style={badgeStyle}
        className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 font-semibold uppercase tracking-wide text-amber-300"
      >
        ⚡ Powered by Tatum RPC
      </span>
    </div>
  );
}
