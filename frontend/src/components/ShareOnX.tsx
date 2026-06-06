interface ShareOnXProps {
  ogScore: number;
  ogEmoji: string;
  shareUrl: string;
}

export default function ShareOnX({ ogScore, ogEmoji, shareUrl }: ShareOnXProps) {
  const text = [
    "Just scanned this Sui wallet on SuiSleuth 🕵️",
    `OG Score: ${ogScore}/100 ${ogEmoji}`,
    "",
    `Full report stored on @WalrusFoundation: ${shareUrl}`,
    "",
    "@SuiNetwork @Tatum_io #SuiSleuth #Sui",
  ].join("\n");

  const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#0f0f0f] text-white border border-white/20 hover:border-white/40 transition-colors whitespace-nowrap"
    >
      Share on X
    </a>
  );
}
