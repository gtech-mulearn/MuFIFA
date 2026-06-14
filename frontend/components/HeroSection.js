import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CountdownSkeleton } from "./CountdownSection";

const CountdownSection = dynamic(() => import("./CountdownSection"), {
  ssr: false,
  loading: () => <CountdownSkeleton />,
});

export default function HeroSection() {
  return (
    <>
      {/* Center Trophy Spacer (hidden on mobile to allow vertical centering, shown on desktop) */}
      <div className="hidden lg:flex lg:h-[44vh] w-full items-center justify-center relative">
        {/* Stadium Lights Flare Overlay */}
        <div className="absolute top-[20%] w-[100px] h-[100px] bg-white/20 rounded-full blur-2xl animate-pulse" />
      </div>

      {/* Hero Content Section */}
      <div className="relative z-20 flex flex-col items-start text-left mb-8 pt-86 lg:pt-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 md:mb-8 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          BET BIG. BUILD BIGGER.
        </h1>
        <p className="text-sm md:text-base text-slate-300 font-medium italic tracking-wide mb-8 lg:mb-12">
          You aren't the one watching the show.
          <br /> You're the player here..
        </p>

        {/* Hero Buttons */}
        <div className="flex flex-row gap-3 md:gap-4 items-center justify-start w-full max-w-md px-2">
          <Link href="/register" className="cursor-pointer bg-[#FF2E93] text-white px-3 py-2.5 md:px-8 md:py-3 rounded-lg text-xs md:text-sm font-bold tracking-wider hover:bg-[#e0207e] transition-all glow-pink-btn border border-[#FF2E93]/50 whitespace-nowrap flex-1 text-center block">
            Register For Arena
          </Link>
          <button className="cursor-pointer bg-glass border border-white/20 text-white px-3 py-2.5 md:px-8 md:py-3 rounded-lg text-xs md:text-sm font-bold tracking-wider hover:bg-white/10 transition-all whitespace-nowrap flex-1 text-center">
            View
          </button>
        </div>

        {/* Mobile-only Countdown Timer below buttons */}
        <div className="lg:hidden w-full mt-8">
          <CountdownSection />
        </div>
      </div>
    </>
  );
}
