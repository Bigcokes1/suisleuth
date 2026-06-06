import type { WalletAnalysis, WalrusStorageResult } from "../types";
import { computeWalletDNA } from "../utils/wallet";
import FlaggedWarning from "./FlaggedWarning";
import OGBadge from "./OGBadge";
import ShareableLink from "./ShareableLink";
import VerifiedBadges from "./VerifiedBadges";
import WalletDNAChart from "./WalletDNAChart";
import WalrusFailedNotice from "./WalrusFailedNotice";
import WalrusPendingNotice from "./WalrusPendingNotice";

interface ResultCardProps {
  analysis: WalletAnalysis;
  walrus: WalrusStorageResult | null;
  walrusFailed?: boolean;
  walrusPending?: boolean;
  compact?: boolean;
}

function truncateAddress(addr: string, chars = 6): string {
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatBlock({
  label,
  value,
  subValue,
  mono = false,
}: {
  label: string;
  value: string;
  subValue?: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 mb-1">{label}</p>
      <p
        className={`text-sm text-white break-words ${mono ? "font-mono" : "font-medium"}`}
      >
        {value}
      </p>
      {subValue && (
        <p className="mt-1 text-[11px] leading-snug text-white/40 break-words">{subValue}</p>
      )}
    </div>
  );
}

function formatTransactionCount(analysis: WalletAnalysis): {
  value: string;
  subValue?: string;
} {
  const count = analysis.transactionCount.toLocaleString();
  if (!analysis.transactionCountNote) {
    return { value: count };
  }

  return {
    value: `${count}+`,
    subValue: "Estimated from recent activity — actual count may be higher",
  };
}

export default function ResultCard({
  analysis,
  walrus,
  walrusFailed = false,
  walrusPending = false,
  compact = false,
}: ResultCardProps) {
  const suiScanUrl = (path: string) => `https://suiscan.xyz/mainnet/${path}`;
  const dna = computeWalletDNA(analysis);
  const txDisplay = formatTransactionCount(analysis);

  return (
    <div className="w-full min-w-0 space-y-6">
      <FlaggedWarning security={analysis.security} />
      <div className="glass-panel min-w-0 rounded-[28px] p-4 sm:p-6 md:p-8">
        <VerifiedBadges walrusStored={Boolean(walrus)} />

        <div className="mb-8 flex flex-col items-center gap-8 border-b border-white/10 pb-8 lg:flex-row">
          <div className="flex min-w-0 w-full flex-1 flex-col items-center gap-6 sm:flex-row">
            <OGBadge ogScore={analysis.ogScore} />
            <WalletDNAChart dna={dna} />
          </div>
          {!compact && (
            <div className="flex-1 text-center lg:text-left space-y-2 w-full">
              <p className="text-[10px] uppercase tracking-[0.22em] text-sui-accent font-semibold">
                Intelligence Report
              </p>
              <p className="font-mono text-sm text-white break-all">{analysis.address}</p>
              <p className="text-xs text-white/40">
                Scanned {formatDate(analysis.analyzedAt)} · Sui Mainnet
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatBlock
            label="Wallet Age"
            value={
              analysis.walletAge.daysOld !== null
                ? `${analysis.walletAge.daysOld.toLocaleString()} days · First tx ${formatDate(analysis.walletAge.firstTransactionDate)}`
                : "No on-chain history found"
            }
          />
          <StatBlock
            label="Total Transactions"
            value={txDisplay.value}
            subValue={txDisplay.subValue}
          />
          <StatBlock
            label="First Activity"
            value={
              analysis.firstActivity
                ? `${formatDate(analysis.firstActivity.timestamp)} · ${truncateAddress(analysis.firstActivity.digest, 8)}`
                : "None detected"
            }
            mono
          />
          <StatBlock
            label="Funding Source"
            value={
              analysis.fundingSource?.address
                ? `${truncateAddress(analysis.fundingSource.address)}${analysis.fundingSource.amountSui ? ` · ${analysis.fundingSource.amountSui} SUI` : ""}`
                : "Unknown"
            }
            mono
          />
        </div>

        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 mb-3">
            Object Holdings
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total", value: analysis.holdings.totalObjects },
              { label: "Coins", value: analysis.holdings.coins },
              { label: "NFTs", value: analysis.holdings.nfts },
              { label: "Other", value: analysis.holdings.other },
              { label: "SUI Balance", value: analysis.holdings.suiBalance ?? "—" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center"
              >
                <p className="text-[10px] uppercase text-white/40">{item.label}</p>
                <p className="text-lg font-semibold text-white font-mono tabular-nums">
                  {typeof item.value === "number"
                    ? item.value.toLocaleString()
                    : item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {!compact && analysis.firstActivity && (
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={suiScanUrl(`tx/${analysis.firstActivity.digest}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-4 py-2 rounded-full border border-white/15 text-sui-accent hover:bg-sui-accent/10 transition-colors"
            >
              View first tx on Suiscan →
            </a>
            {analysis.fundingSource?.address && (
              <a
                href={suiScanUrl(`account/${analysis.fundingSource.address}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium px-4 py-2 rounded-full border border-white/15 text-sui-accent hover:bg-sui-accent/10 transition-colors"
              >
                View funder on Suiscan →
              </a>
            )}
          </div>
        )}
      </div>

      {walrus && (
        <ShareableLink
          shareableUrl={walrus.shareableUrl}
          blobId={walrus.blobId}
          ogScore={analysis.ogScore.score}
          ogEmoji={analysis.ogScore.emoji}
        />
      )}
      <WalrusPendingNotice show={walrusPending && !walrus} />
      <WalrusFailedNotice show={walrusFailed && !walrus && !walrusPending} />
    </div>
  );
}

export { truncateAddress, formatDate };
