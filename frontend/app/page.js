"use client";

import React from "react";
import BackgroundVideo from "@/components/BackgroundVideo";
import HeroSection from "@/components/HeroSection";
import MetagameSection from "@/components/MetagameSection";
// import BiddingBoard from "@/components/BiddingBoard";
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
  return (
    <div className="w-full bg-[#090A0F] text-white flex flex-col font-sans relative select-none">
      <BackgroundVideo />

      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_25%,#090A0F_95%)] opacity-85 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[rgba(148,163,184,0.05)] via-transparent to-[rgba(6, 182, 212,0.03)] pointer-events-none" />

      <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] indigo-accent-glow pointer-events-none rounded-full opacity-35" />
      <div className="absolute top-[40%] right-[5%] w-[35vw] h-[35vw] cyan-accent-glow pointer-events-none rounded-full opacity-35" />
      <div className="absolute top-[65%] left-[30%] w-[35vw] h-[35vw] slate-accent-glow pointer-events-none rounded-full opacity-20" />

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen relative z-10 w-full">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between p-6 md:p-8 lg:p-12 relative overflow-hidden min-h-[100vh]">
          <div className="flex flex-col justify-center min-h-[calc(100vh-3rem)] md:min-h-[calc(100vh-4rem)] lg:contents">
            <HeroSection />
          </div>
          <MetagameSection />
        </div>

        <div className="lg:col-span-5 xl:col-span-4 bg-transparent p-6 md:p-8 lg:pt-12 flex flex-col gap-6 md:gap-8 justify-start relative z-10 border-t lg:border-t-0 lg:border-l border-white/5">
          {/* <BiddingBoard /> */}
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
