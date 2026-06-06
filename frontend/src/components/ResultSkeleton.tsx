export default function ResultSkeleton() {
  return (
    <div className="mt-8 max-w-3xl mx-auto glass-panel rounded-[28px] p-6 sm:p-8 animate-pulse">
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="h-6 w-36 rounded-full bg-white/10" />
        <div className="h-6 w-32 rounded-full bg-white/10" />
        <div className="h-6 w-40 rounded-full bg-white/10" />
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-8 mb-8 pb-8 border-b border-white/10">
        <div className="w-28 h-28 rounded-full bg-white/10" />
        <div className="flex-1 w-full space-y-3">
          <div className="h-3 w-32 bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-3 w-48 bg-white/10 rounded" />
        </div>
        <div className="w-[180px] h-[180px] rounded-xl bg-white/10 hidden sm:block" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-white/10" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/10" />
        ))}
      </div>
      <p className="text-center text-xs text-white/30 mt-6 font-mono">
        Fetching on-chain intelligence…
      </p>
    </div>
  );
}
