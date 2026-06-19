import React from "react";
import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Under Maintenance",
  description:
    "The site is currently undergoing scheduled maintenance and will be live tomorrow morning.",
  url: "/development",
});

export default function DevelopmentPage() {
  return (
    <div className="min-h-screen bg-[#030207] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Renders a subtle stadium silhouette in the background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />

      {/* Soft ambient glows behind the main container */}
      <div className="absolute top-[25%] left-[15%] w-[40vw] h-[40vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full blur-3xl" />
      <div className="absolute bottom-[25%] right-[15%] w-[40vw] h-[40vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.04)_0%,_transparent_60%)] pointer-events-none rounded-full blur-3xl" />

      {/* Centered container for the maintenance message */}
      <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center gap-8">
        {/* Active pulsing status badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-400 text-[9px] font-black uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Pitch Maintenance</span>
        </div>

        {/* Themed maintenance wrench icon */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/10 to-cyan-500/10 rounded-2xl border border-white/5 shadow-inner" />
          <svg
            className="w-7 h-7 text-slate-400 relative z-10"
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

        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-black uppercase tracking-wider text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Stadium Maintenance
          </h1>
          <p className="text-[11px] text-slate-450 font-medium leading-relaxed max-w-[285px] mx-auto">
            We are currently tuning the pitch engines and updating the tactical
            systems. The arena will be fully live tomorrow morning.
          </p>
        </div>

        {/* Visual divider */}
        <div className="w-12 h-[1px] bg-white/10" />

        {/* Copyright and system status footer */}
        <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">
          © 2026 µFifa '26 • All Systems Normal
        </div>
      </div>
    </div>
  );
}
