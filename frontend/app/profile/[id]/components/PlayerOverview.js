import React from "react";
import Link from "next/link";

export default function PlayerOverview({
  player,
  stats,
  ovr,
  levelData,
  nationRank,
  nationContribution,
  nationPercentage,
  countryCode,
}) {
  return (
    <div className="bg-[#090715]/40 border border-white/8 backdrop-blur-md rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-6">
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 border-b border-white/5 pb-2.5">
          Player Overview
        </h3>

        {/* 4 Stats Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {/* Points Card */}
          <div className="bg-[#0b0c16]/60 border border-white/5 hover:border-violet-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] duration-300 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mb-3 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <svg
                className="w-6 h-6 text-violet-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="text-2xl font-black text-white leading-none">
              {player.mu_points || 0}
            </span>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 mt-2">
              μPoints
            </span>
          </div>

          {/* Rank Card */}
          <div className="bg-[#0b0c16]/60 border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] duration-300 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mb-3 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <svg
                className="w-6 h-6 text-blue-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-2xl font-black text-white leading-none">
              #{player.rank || 12}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
              Global Rank
            </span>
          </div>

          {/* Challenges Card */}
          <Link href="/tasks" className="block">
            <div className="bg-[#0b0c16]/60 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] duration-300 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <svg
                  className="w-6 h-6 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <span className="text-2xl font-black text-white leading-none">
                {player.completed_tasks_count || 0}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                Challenges
              </span>
            </div>
          </Link>

          {/* Overall Rating Card */}
          <div className="bg-[#0b0c16]/60 border border-white/5 hover:border-amber-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] duration-300 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <svg
                className="w-6 h-6 text-amber-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-2xl font-black text-white leading-none">
              {ovr}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
              Overall Rating
            </span>
          </div>
        </div>
      </div>

      {/* LEVEL PROGRESS SECTION */}
      <div className="bg-[#100e23]/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-2 mt-4">
        <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">
          Level Progress
        </span>
        <div className="flex items-center justify-between text-sm font-extrabold mt-1">
          <span className="text-[#8B5CF6]">Level {levelData.level}</span>
          <span className="text-slate-400 font-medium">
            {levelData.nextXp > 0
              ? `${levelData.nextXp - levelData.currentLevelXp} XP to Level ${levelData.level + 1}`
              : "Max Level Reached"}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1">
          <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] rounded-full transition-all duration-500"
              style={{ width: `${levelData.xpPercent}%` }}
            />
          </div>
          <span className="text-sm font-black text-slate-300">
            {levelData.xpPercent}%
          </span>
        </div>
      </div>

      {/* NATION STANDING SECTION */}
      {player.team && (
        <div className="bg-[#100e23]/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-3 mt-4">
          <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">
            Nation Standing
          </span>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex items-center justify-center shrink-0">
                <span className={`fi fi-${countryCode} scale-125`} />
              </div>
              <span className="text-sm font-extrabold text-white">
                {player.team} Rank #{nationRank}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <span>Contribution</span>
              <span className="text-[#10B981] font-extrabold">
                {nationContribution}%
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 mt-1">
            <div
              className="h-full bg-[#10B981] rounded-full transition-all duration-500"
              style={{ width: `${nationContribution}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase">
            Top {nationPercentage}% of {player.team} Players
          </span>
        </div>
      )}
    </div>
  );
}
