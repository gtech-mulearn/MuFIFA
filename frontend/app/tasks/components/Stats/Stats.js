import Image from "next/image";
import Link from "next/link";

export default function Stats({ activeTier, completedCount, totalCount }) {
  const progressPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pointsEarned = completedCount * 5; // e.g. each challenge is 5 points

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* TIER LEVEL PROGRESS CARD */}
      <div className="lg:col-span-5 bg-gradient-to-b from-[#110e24]/90 to-[#070613]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex items-center gap-5 shadow-2xl">
        {/* Glowing Shield Cup Badge */}
        <div className="relative w-23 h-23 shrink-0 select-none flex items-center justify-center rounded-full bg-[#121021]/80 shadow-2xl">
          <div className="absolute -inset-0.5 rounded-full bg-violet-600/20 blur opacity-75" />
          <div className="relative z-10 flex items-center justify-center">
            <Image
              src="/playerCard/trophy.webp"
              alt="Trophy"
              width={54}
              height={54}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400">
            µFIFA CAMPAIGN PROGRESSION
          </span>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
            <span>Level Progress</span>
            <span className="text-white font-extrabold">
              {progressPercentage}%
            </span>
          </div>
          {/* Progress bar */}
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

      {/* CENTRAL ARENA GLOWING SHIELD */}
      <div className="lg:col-span-2 hidden lg:flex items-center justify-center relative select-none">
        <div className="absolute w-24 h-24 bg-violet-600/15 rounded-full blur-xl pointer-events-none" />

        <Image src="/trophy.webp" alt="Trophy" width={44} height={44} />
      </div>

      {/* ACHIEVEMENTS CARD */}
      <div className="lg:col-span-5 bg-gradient-to-b from-[#110e24]/90 to-[#070613]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between shadow-2xl relative overflow-hidden">
        {/* Blurry content */}
        <div className="flex justify-between items-center pb-2 border-b border-white/5 blur-[1.5px] pointer-events-none select-none">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            Achievements
          </span>
          <Link
            href="/leaderboard"
            className="text-[9px] font-black text-violet-400 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-all"
          >
            <span>View All</span>
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

        <div className="grid grid-cols-4 gap-2 mt-4 blur-[2.5px] pointer-events-none select-none">
          {/* Badge 1: First Referral */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-11 h-11 rounded-full border border-violet-500/20 bg-violet-500/5 flex items-center justify-center text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.1)] group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <span className="text-[7.5px] font-black text-white text-center tracking-wide leading-tight group-hover:text-violet-300 transition-colors uppercase">
              First Referral
            </span>
            <span className="text-[7px] font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1 rounded uppercase">
              Earned
            </span>
          </div>

          {/* Badge 2: Challenge Master */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-11 h-11 rounded-full border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.1)] group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <span className="text-[7.5px] font-black text-white text-center tracking-wide leading-tight group-hover:text-indigo-300 transition-colors uppercase">
              Challenge Master
            </span>
            <span className="text-[7px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1 rounded uppercase">
              Earned
            </span>
          </div>

          {/* Badge 3: Team Supporter */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-11 h-11 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)] group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span className="text-[7.5px] font-black text-white text-center tracking-wide leading-tight group-hover:text-emerald-300 transition-colors uppercase">
              Team Supporter
            </span>
            <span className="text-[7px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded uppercase">
              Earned
            </span>
          </div>

          {/* Badge 4: 7-Day Streak */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-11 h-11 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)] group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
                />
              </svg>
            </div>
            <span className="text-[7.5px] font-black text-white text-center tracking-wide leading-tight group-hover:text-amber-300 transition-colors uppercase">
              7-Day Streak
            </span>
            <span className="text-[7px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 rounded uppercase">
              Earned
            </span>
          </div>
        </div>

        {/* Locked Overlay */}
        <div className="absolute inset-0 bg-[#090715]/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5 z-10 select-none">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/35 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)] animate-pulse">
            <svg
              className="w-4.5 h-4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
