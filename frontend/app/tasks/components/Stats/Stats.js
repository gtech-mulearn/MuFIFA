import Image from "next/image";
import Link from "next/link";
import { calculateLevel } from "@/utils/constants";

// Renders the top progression metrics, level badge, and skill attributes gauges
export default function Stats({
  completedCount,
  totalCount,
  completedPoints,
  player,
}) {
  const progressPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pointsEarned = completedPoints || 0;

  const xp = player?.xp_breakdown || {};
  
  // Calculate width percentage relative to a target 1000 XP cap for attributes visual scaling
  const getXpPercent = (val) =>
    Math.min(Math.round(((val || 0) / 1000) * 100), 100);

  const totalXp =
    (xp.creativity || 0) +
    (xp.branding || 0) +
    (xp.innovation || 0) +
    (xp.teamwork || 0) +
    (xp.execution || 0);
  const lvlInfo = calculateLevel(totalXp);
  const currentLevel = lvlInfo ? lvlInfo.level : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch font-sans">
      {/* Campaign progression card */}
      <div className="lg:col-span-5 bg-gradient-to-b from-[#110e24]/90 to-[#070613]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex items-center gap-5 shadow-2xl">
        {/* Campaign progression trophy container */}
        <div className="relative w-23 h-23 shrink-0 select-none flex items-center justify-center rounded-full bg-[#121021]/80 shadow-2xl">
          <div className="absolute -inset-0.5 rounded-full bg-violet-600/20 blur opacity-75" />
          <div className="relative z-10 flex items-center justify-center">
            <Image src="/trophy.webp" alt="Trophy" width={34} height={34} />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400">
            <span className="normal-case">µ</span>FIFA CAMPAIGN PROGRESSION
          </span>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
            <span>Level Progress</span>
            <span className="text-white font-extrabold">
              {progressPercentage}%
            </span>
          </div>
          {/* Main progression completion indicator bar */}
          <div className="w-full bg-[#18152c] h-2 rounded-full overflow-hidden mt-0.5">
            <div
              className="bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold mt-1">
            <span>
              {completedCount} / {totalCount} Challenges Completed
            </span>
            <span className="text-amber-400">
              +{pointsEarned} μPoints Earned
            </span>
          </div>
        </div>
      </div>

      {/* Decorative center column highlighting the calculated user level */}
      <div className="lg:col-span-2 hidden lg:flex items-center justify-center relative select-none">
        <div className="absolute w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Level badge shield */}
        <div className="relative w-18 h-18 bg-gradient-to-b from-amber-500/20 to-yellow-600/5 border-2 border-amber-500/30 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.15)] backdrop-blur-md transform hover:scale-105 transition-transform duration-300">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 blur opacity-15" />
          <span className="text-[8px] font-black uppercase tracking-widest text-amber-500/80 leading-none">
            Level
          </span>
          <span className="text-2xl font-black text-white mt-1 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
            {currentLevel}
          </span>
        </div>
      </div>

      {/* Skills attribute breakdown panel */}
      <div className="lg:col-span-5 bg-gradient-to-b from-[#110e24]/90 to-[#070613]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            Player Attribute Stats
          </span>
          <Link
            href="/points-history"
            className="text-[9px] font-black text-violet-400 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-all"
          >
            <span>XP History</span>
            <svg
              className="w-2.5 h-2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </Link>
        </div>

        {/* Attributes details grid */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 mt-3 flex-1 justify-center">
          {[
            {
              name: "Creativity",
              val: xp.creativity || 0,
              barColor: "bg-rose-500",
              textColor: "text-rose-400",
              span: false,
            },
            {
              name: "Branding",
              val: xp.branding || 0,
              barColor: "bg-amber-500",
              textColor: "text-amber-400",
              span: false,
            },
            {
              name: "Innovation",
              val: xp.innovation || 0,
              barColor: "bg-cyan-500",
              textColor: "text-cyan-400",
              span: false,
            },
            {
              name: "Teamwork",
              val: xp.teamwork || 0,
              barColor: "bg-emerald-500",
              textColor: "text-emerald-400",
              span: false,
            },
            {
              name: "Execution",
              val: xp.execution || 0,
              barColor: "bg-indigo-500",
              textColor: "text-indigo-400",
              span: true,
            },
          ].map((attr) => (
            <div
              key={attr.name}
              className={`flex flex-col gap-0.5 ${attr.span ? "col-span-2 mt-1" : ""}`}
            >
              <div className="flex items-center justify-between text-[9px] font-black tracking-wider uppercase">
                <span className="text-slate-400">{attr.name}</span>
                <span className={attr.textColor}>{attr.val} XP</span>
              </div>
              <div className="w-full bg-[#18152c] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${attr.barColor} transition-all duration-500`}
                  style={{ width: `${getXpPercent(attr.val)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
