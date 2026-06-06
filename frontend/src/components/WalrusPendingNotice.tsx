interface WalrusPendingNoticeProps {
  show: boolean;
}

export default function WalrusPendingNotice({ show }: WalrusPendingNoticeProps) {
  if (!show) return null;

  return (
    <div className="rounded-[20px] border border-sui-accent/25 bg-sui-accent/10 px-5 py-4">
      <p className="text-sm font-medium text-sui-accent">
        Saving report to Walrus…
      </p>
      <p className="text-xs text-white/50 mt-2 leading-relaxed">
        Your analysis is ready. Permanent storage is finishing in the background.
      </p>
    </div>
  );
}
