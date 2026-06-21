"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BackgroundVideo from "@/components/BackgroundVideo";
import Hero from "@/components/home/Hero";
import WhatIsMuFifa from "@/components/home/WhatIsMuFifa";
import WhyJoin from "@/components/home/WhyJoin";
import MakeAnImpact from "@/components/home/MakeAnImpact";
import TopNations from "@/components/home/TopNations";
import HowItWorks from "@/components/home/HowItWorks";
import Rewards from "@/components/home/Rewards";
import TrustedCommunity from "@/components/home/TrustedCommunity";
import OurMission from "@/components/home/OurMission";

import { usePlayer } from "@/components/PlayerContext";

export default function Home() {
  const router = useRouter();
  const { player, loading } = usePlayer();

  React.useEffect(() => {
    if (!loading && player) {
      router.replace("/dashboard");
    }
  }, [player, loading, router]);

  return (
    <div className="w-full bg-[#090A0F] text-white flex flex-col font-sans relative select-none">
      {/* Homepage Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none homepage-bg" />

      <BackgroundVideo />

      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_25%,#090A0F_95%)] opacity-85 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[rgba(148,163,184,0.05)] via-transparent to-[rgba(6, 182, 212,0.03)] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-tl from-[rgba(167,139,250,0.04)] via-transparent to-transparent pointer-events-none" />


      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] indigo-accent-glow pointer-events-none rounded-full opacity-35" />
      <div className="absolute top-[30%] right-[5%] w-[35vw] h-[35vw] cyan-accent-glow pointer-events-none rounded-full opacity-35" />
      <div className="absolute top-[60%] left-[20%] w-[35vw] h-[35vw] slate-accent-glow pointer-events-none rounded-full opacity-20" />
      <div className="absolute top-[80%] right-[10%] w-[35vw] h-[35vw] indigo-accent-glow pointer-events-none rounded-full opacity-20" />

      {/* Main Home content sections */}
      <Hero />
      <div className="relative w-full section-alt z-10">
        <WhatIsMuFifa />
        <WhyJoin />
        <MakeAnImpact />
        <TopNations />
        <HowItWorks />
        <Rewards />
        <TrustedCommunity />
        <OurMission />
      </div>
    </div>
  );
}
