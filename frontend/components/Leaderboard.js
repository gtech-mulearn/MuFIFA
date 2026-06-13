import React from "react";

export default function Leaderboard() {
  return (
    <div className="lg:flex-1 bg-glass-card rounded-2xl p-5 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-4 bg-[linear-gradient(110deg,rgba(255,255,255,0.02),rgba(0,229,255,0.015))]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold tracking-wide text-white">
            Live Squad Leaderboard
          </h2>
          <p className="text-[10px] text-slate-400 leading-tight">
            Top teams leaderboard the live team.
          </p>
        </div>
        <button className="text-[9px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-1 rounded-full hover:bg-white/10 transition-all flex items-center gap-1 cursor-pointer">
          <span>No of Bets</span>
          <span className="text-[7px]">▼</span>
        </button>
      </div>

      {/* Leaderboard Table replaced with Registration Ongoing state */}
      <div className="flex-grow flex flex-col items-center justify-center py-12 px-4 text-center bg-black/30 border border-white/5 rounded-xl min-h-[200px] relative overflow-hidden">
        {/* Glowing aura */}
        <div className="absolute w-24 h-24 bg-[#00E5FF]/10 rounded-full blur-xl animate-pulse" />
        
        {/* Cyberpunk Leaderboard icon */}
        <div className="relative mb-3 flex items-center justify-center w-12 h-12 rounded-full border border-sky-500/30 bg-sky-500/5 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.15)] animate-[pulse_2s_ease-in-out_infinite]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
        </div>

        <span className="text-xs tracking-[0.2em] text-[#00E5FF] font-black uppercase mb-1 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
          REGISTRATION IS ONGOING
        </span>
        <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
          The squad board will activate once matches kickoff.
        </p>
      </div>
    </div>
  );
}
