interface WalrusFailedNoticeProps {
  show: boolean;
}

export default function WalrusFailedNotice({ show }: WalrusFailedNoticeProps) {
  if (!show) return null;

  return (
    <div className="rounded-[20px] border border-amber-400/30 bg-amber-500/10 px-5 py-4">
      <p className="text-sm font-medium text-amber-200">
        ⚠️ Could not store on Walrus — report not saved permanently
      </p>
      <p className="text-xs text-amber-100/60 mt-2 leading-relaxed">
        Walrus Mainnet needs a funded wallet with{" "}
        <span className="text-amber-100/80">WAL tokens</span> and{" "}
        <span className="text-amber-100/80">SUI</span> for gas. Set{" "}
        <code className="text-amber-200/90">WALRUS_PRIVATE_KEY</code> in{" "}
        <code className="text-amber-200/90">backend/.env</code> and restart the
        server. Your scan results above are still valid for this session.
      </p>
    </div>
  );
}
