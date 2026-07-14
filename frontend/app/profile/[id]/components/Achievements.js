import React from "react";
import Image from "next/image";

export default function Achievements({ achievementsList }) {
  return (
    <div className="bg-[#090715]/40 border border-white/8 backdrop-blur-md rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">
          Achievements
        </h3>
        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5"
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
          Locked
        </span>
      </div>

      {/* Badges container with relative position for the lock overlay */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Centered Non-Overflowing Badges List (Blurred and non-interactive) */}
        <div className="flex items-center justify-center gap-4 pb-1 pr-0 flex-wrap blur-[3px] pointer-events-none select-none">
          {achievementsList.slice(0, 4).map((badge, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center text-center gap-2 p-4 rounded-2xl border min-w-[110px] flex-1 max-w-[140px] transition-all ${
                badge.earned
                  ? "bg-[#100e23]/60 border-violet-500/10"
                  : "bg-[#100e23]/20 border-white/5 opacity-40"
              }`}
            >
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                {badge.earned ? (
                  <Image
                    src={badge.icon}
                    alt={badge.name}
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-slate-500"
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
                )}
              </div>
              <span className="text-xs font-extrabold text-slate-200 leading-tight mt-1">
                {badge.name}
              </span>
              <span className="text-[9px] font-bold text-slate-500 leading-none">
                {badge.earned ? badge.desc : "Locked"}
              </span>
            </div>
          ))}
        </div>

        {/* Premium Lock Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] z-20">
          <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
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
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[2px] text-amber-500 mt-3 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            Achievements locked
          </span>
          <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            Unlocks at Level 10
          </span>
        </div>
      </div>
    </div>
  );
}
