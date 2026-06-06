import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <img
            src="/sui-logo.svg"
            alt="Sui"
            className="h-8 w-auto drop-shadow-[0_0_12px_rgba(77,162,255,0.45)]"
          />
          <span className="text-white font-semibold tracking-[0.22em] text-sm sm:text-base uppercase">
            SuiSleuth
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[11px] font-medium tracking-[0.18em] text-white/70 uppercase">
          <a href="#scan" className="hover:text-white transition-colors">
            Scan
          </a>
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </a>
          <a
            href="https://suiscan.xyz/mainnet/home"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Explorer
          </a>
        </nav>

        <div className="shrink-0 rounded-full border border-white/25 bg-white/5 px-4 py-2 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-sm">
          Sui Mainnet
        </div>
      </div>
    </header>
  );
}
