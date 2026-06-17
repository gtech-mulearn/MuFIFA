export default function Timeline({ activeTier, level2Unlocked }) {
  // Determine states
  const t1Completed = level2Unlocked || activeTier === 2;
  const t2InProgress = level2Unlocked || activeTier === 2;

  return (
    <div className="w-full bg-[#110e24]/40 border border-white/5 rounded-2xl px-6 py-4 backdrop-blur-md flex items-center justify-between shadow-md">
      <div className="flex items-center justify-between w-full max-w-3xl mx-auto gap-4 relative">
        {/* Timeline Path Lines (underlay) */}
        <div className="absolute top-[21px] left-[10%] right-[10%] h-0.5 bg-dashed-custom pointer-events-none z-0">
          <div className="flex w-full h-full">
            {/* Step 1 to 2 line */}
            <div className={`h-full transition-all duration-500 ${t1Completed ? "w-1/3 bg-emerald-500" : "w-1/3 bg-white/10"}`} />
            {/* Step 2 to 3 line */}
            <div className="w-1/3 h-full border-t border-dashed border-white/10" />
            {/* Step 3 to 4 line */}
            <div className="w-1/3 h-full border-t border-dashed border-white/10" />
          </div>
        </div>

        {/* STEP 1: TIER 1 */}
        <div className="flex items-center gap-3 relative z-10">
          {t1Completed ? (
            <div className="w-11 h-11 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          ) : (
            <div className="w-11 h-11 rounded-full bg-violet-600 border-2 border-violet-400 flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] font-black text-sm">
              1
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Tier 1</span>
            <span className={`text-[9px] font-black uppercase ${t1Completed ? "text-emerald-400" : "text-violet-400 animate-pulse"}`}>
              {t1Completed ? "Completed" : "In Progress"}
            </span>
          </div>
        </div>

        {/* STEP 2: TIER 2 */}
        <div className="flex items-center gap-3 relative z-10">
          {t2InProgress ? (
            <div className="w-11 h-11 rounded-full bg-[#1c1233] border-2 border-violet-500 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)] font-black text-sm">
              2
            </div>
          ) : (
            <div className="w-11 h-11 rounded-full bg-[#0a0815] border border-white/10 flex items-center justify-center text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          )}
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-wider ${t2InProgress ? "text-white" : "text-slate-500"}`}>Tier 2</span>
            <span className={`text-[9px] font-black uppercase ${t2InProgress ? "text-violet-400 animate-pulse" : "text-slate-600"}`}>
              {t2InProgress ? "In Progress" : "Locked"}
            </span>
          </div>
        </div>

        {/* STEP 3: TIER 3 */}
        <div className="flex items-center gap-3 relative z-10 opacity-75">
          <div className="w-11 h-11 rounded-full bg-[#0a0815] border border-white/10 flex items-center justify-center text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tier 3</span>
            <span className="text-[9px] font-black text-slate-600 uppercase">Locked</span>
          </div>
        </div>

        {/* STEP 4: TIER 4 */}
        <div className="flex items-center gap-3 relative z-10 opacity-60">
          <div className="w-11 h-11 rounded-full bg-[#0a0815] border border-white/10 flex items-center justify-center text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tier 4</span>
            <span className="text-[9px] font-black text-slate-600 uppercase">Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
