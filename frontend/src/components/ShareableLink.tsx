import ShareOnX from "./ShareOnX";

interface ShareableLinkProps {
  shareableUrl: string;
  blobId: string;
  ogScore: number;
  ogEmoji: string;
}

export default function ShareableLink({
  shareableUrl,
  blobId,
  ogScore,
  ogEmoji,
}: ShareableLinkProps) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <div className="glass-panel min-w-0 rounded-[24px] border-emerald-400/20 p-4 sm:p-5">
      <p className="mb-3 text-xs uppercase tracking-wider text-white/45">
        Permanent report link
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <a
          href={shareableUrl}
          className="min-w-0 flex-1 break-all rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-xs text-sui-accent hover:underline"
        >
          {shareableUrl}
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="whitespace-nowrap rounded-xl border border-white/15 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:border-sui-accent hover:text-sui-accent"
        >
          Copy link
        </button>
        <ShareOnX ogScore={ogScore} ogEmoji={ogEmoji} shareUrl={shareableUrl} />
      </div>
      <p className="mt-2 break-all font-mono text-[10px] text-white/25">
        blobId: {blobId}
      </p>
    </div>
  );
}
