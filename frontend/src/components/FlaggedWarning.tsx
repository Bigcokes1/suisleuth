interface FlaggedWarningProps {
  security: {
    flagged: boolean;
    status: string;
    source?: string;
    description?: string;
  };
}

export default function FlaggedWarning({ security }: FlaggedWarningProps) {
  if (!security.flagged) return null;

  return (
    <div
      className="rounded-[20px] border border-amber-400/40 bg-amber-500/10 px-5 py-4 mb-6"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0" aria-hidden>
          ⚠️
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-200">
            Flagged — This address has been reported as malicious
          </p>
          {security.description && (
            <p className="text-xs text-amber-100/70 mt-1">{security.description}</p>
          )}
          {security.source && (
            <p className="text-[10px] font-mono text-amber-100/50 mt-2 uppercase tracking-wider">
              Source: {security.source}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
