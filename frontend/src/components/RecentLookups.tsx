import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { RecentLookup } from "../types";
import { timeAgo, truncateAddress } from "../utils/wallet";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function RecentLookups() {
  const [lookups, setLookups] = useState<RecentLookup[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/recent`);
        if (!res.ok) return;
        const data = (await res.json()) as { lookups: RecentLookup[] };
        setLookups(data.lookups ?? []);
      } catch {
        /* ignore */
      }
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (lookups.length === 0) return null;

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-sui-accent font-semibold mb-2">
          Walrus Live Feed
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          Recent Lookups
        </h2>
        <p className="text-sm text-white/45 mt-2">
          Real analyses stored permanently on Walrus
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {lookups.map((item) => (
          <Link
            key={`${item.blobId}-${item.timestamp}`}
            to={`/report/${item.blobId}`}
            className="glass-panel rounded-2xl p-4 hover:border-sui-accent/40 transition-colors group"
          >
            <p className="font-mono text-sm text-white group-hover:text-sui-accent transition-colors">
              {truncateAddress(item.address, 6, 4)}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-sui-accent">
                {item.ogEmoji} {item.ogScore}/100
              </span>
              <span className="text-[10px] text-white/40">{timeAgo(item.timestamp)}</span>
            </div>
            <p className="text-[10px] text-white/30 mt-1 truncate">{item.ogLabel}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
