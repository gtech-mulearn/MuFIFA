export default function TierSelector({ activeTier, setActiveTier, level2Unlocked }) {
  return (
    <div className="flex bg-[#121625]/60 border border-white/5 p-1.5 rounded-2xl w-full max-w-sm mx-auto shadow-md backdrop-blur-md">
      <button
        onClick={() => setActiveTier(1)}
        className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
          activeTier === 1
            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Tier 1
      </button>
      <button
        onClick={() => setActiveTier(2)}
        className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer relative ${
          activeTier === 2
            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Tier 2
        {!level2Unlocked && (
          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-955 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter scale-90 border border-[#07050f]">
            Locked
          </span>
        )}
      </button>
    </div>
  );
}
