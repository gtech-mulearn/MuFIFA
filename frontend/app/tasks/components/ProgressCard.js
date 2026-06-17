export default function ProgressCard({ activeTier, tier1CompletedCount, tier1TotalCount }) {
  return (
    <div className="flex flex-col gap-2 bg-[#121625]/60 border border-white/5 backdrop-blur-md px-5 py-4 rounded-2xl w-full md:w-56 shadow-[0_12px_36px_rgba(0,0,0,0.5)] shrink-0 self-start md:self-auto">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
        <span>{activeTier === 1 ? "Tier 1 Progress" : "Tier 2 Progress"}</span>
        <span className="text-[#FBBF24] font-black text-xs">
          {activeTier === 1 ? `${tier1CompletedCount}/${tier1TotalCount}` : "Coming Soon"}
        </span>
      </div>
      <div className="w-full bg-[#1b2034] h-2 rounded-full overflow-hidden mt-1.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            activeTier === 1
              ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              : "bg-gradient-to-r from-slate-500 via-slate-400 to-slate-600 animate-pulse"
          }`}
          style={{ width: `${activeTier === 1 ? (tier1CompletedCount / tier1TotalCount) * 100 : 100}%` }}
        />
      </div>
    </div>
  );
}
