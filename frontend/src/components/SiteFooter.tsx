export default function SiteFooter() {
  return (
    <footer className="relative z-20 w-full mt-auto border-t border-white/10 bg-[#030712]/90 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-8 text-center space-y-3">
        <p className="text-sm text-white/80 font-medium">
          Powered by{" "}
          <span className="text-amber-300">Tatum RPC</span>
          {" · "}
          <span className="text-emerald-300">Walrus</span>
          {" · "}
          <span className="text-sui-accent">Sui Mainnet</span>
        </p>
        <p className="text-xs text-white/50 font-mono tracking-widest uppercase">
          SuiSleuth — Sui Wallet Intelligence
        </p>
      </div>
    </footer>
  );
}
