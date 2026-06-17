import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Under Maintenance | µFifa '26",
  description:
    "The site is currently undergoing scheduled maintenance and will be live tomorrow morning.",
};

export default function DevelopmentPage() {
  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient glows */}
      <div className="absolute top-[20%] left-[10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.12)_0%,_transparent_60%)] pointer-events-none rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[20%] right-[10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full blur-3xl" />

      {/* Main glassmorphism card */}
      <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-6">
        {/* Pulsing indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          <span>Pitch Maintenance</span>
        </div>

        {/* Big icon */}
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-lg my-2">
          <svg
            className="w-10 h-10 text-slate-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17L17.25 21A2.67 2.67 0 1113.5 17.25l-5.83-5.83m5.83 3.75l-5.83-5.83M13.5 17.25L10.5 20.25M9.75 11.25L3 18m6-6.75L12 9.75M3 18l3.75-3.75M3 18l-1.5-1.5M12 9.75L15 6.75m-3 3L9 6.75m6 0l3.75-3.75M15 6.75l3 3M18.75 3L21 5.25m-2.25-2.25L15 6.75m3.75-3.75l3 3M18 10.5l3-3"
            />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">
            Stadium Maintenance
          </h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
            We are currently tuning the pitch engines and updating the tactical
            systems. The site will be fully live and ready tomorrow morning!
          </p>
        </div>

        <div className="w-full h-px bg-white/5 my-2" />

        {/* Link to Admin panel */}
        {/* <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Administrative Access
          </span>
          <Link
            href="/admin"
            className="group flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            <span>Access Admin Control Panel</span>
            <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div> */}
      </div>

      <div className="mt-8 text-[10px] text-slate-600 font-medium tracking-wider uppercase z-10">
        © 2026 µFifa '26 • All Systems Normal
      </div>
    </div>
  );
}
