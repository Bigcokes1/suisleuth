import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { WalletDNA } from "../types";

interface WalletDNAChartProps {
  dna: WalletDNA;
}

export default function WalletDNAChart({ dna }: WalletDNAChartProps) {
  const data = [
    { axis: "Age", value: dna.age },
    { axis: "Activity", value: dna.activity },
    { axis: "Diversity", value: dna.diversity },
    { axis: "OG Status", value: dna.ogStatus },
    { axis: "Consistency", value: dna.consistency },
  ];

  return (
    <div className="w-full max-w-[220px] mx-auto sm:mx-0">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 mb-2 text-center sm:text-left">
        Wallet DNA
      </p>
      <div className="h-[180px] rounded-xl border border-white/10 bg-black/30 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="rgba(255,255,255,0.12)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 9 }}
            />
            <Radar
              dataKey="value"
              stroke="#4DA2FF"
              fill="#4DA2FF"
              fillOpacity={0.35}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
