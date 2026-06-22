"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CountdownSkeleton } from "./CountdownSection";
import { usePlayer } from "@/components/PlayerContext";

const CountdownSection = dynamic(() => import("./CountdownSection"), {
  ssr: false,
  loading: () => <CountdownSkeleton />,
});

export default function HeroSection() {
  const { player } = usePlayer();

  return (
    <>
      <div className="hidden lg:flex lg:h-[30vh] w-full items-center justify-center relative">
        <div className="absolute top-[20%] w-[100px] h-[100px] bg-white/20 rounded-full blur-2xl animate-pulse" />
      </div>

      <div className="relative z-20 flex flex-col items-start text-left mb-8 pt-12 lg:pt-12">
        <h1 className="text-[3rem] sm:text-[3.5rem] md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 md:mb-8 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          FOR THE GAME. FOR THE SPIRIT.
        </h1>
        <p className="text-sm md:text-base text-slate-300 font-medium italic tracking-wide mb-8 lg:mb-12">
          You aren't the one watching the show.
          <br /> You're the player here.
        </p>

        <div className="flex flex-row gap-3 md:gap-4 items-center justify-start w-full max-w-md px-2">
          <Link
            href={player ? "/dashboard" : "/register"}
            className="cursor-pointer bg-[#4F46E5] text-white px-3 py-2.5 md:px-8 md:py-3 rounded-lg text-xs md:text-sm font-bold tracking-wider hover:bg-[#4338CA] transition-all glow-indigo-btn border border-[#4F46E5]/50 whitespace-nowrap flex-1 text-center block"
          >
            {player ? "Enter The Arena" : "Register For Arena"}
          </Link>
        </div>

        <div className="lg:hidden w-full mt-8">
          <CountdownSection />
        </div>
      </div>
    </>
  );
}
