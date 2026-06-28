"use client";

import React from "react";
import Image from "next/image";

export default function WhyJoin() {
  const cards = [
    {
      title: "No Borrowed Glory",
      desc: "Stop yelling at a screen. Get on the leaderboard and earn points yourself.",
      icon: (
        <svg
          className="w-5 h-5 text-[#A78BFA]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      glow: "border-[#A78BFA]/10 bg-[#0D0B21]/40 hover:border-[#A78BFA]/30 shadow-[0_0_12px_rgba(167,139,250,0.02)]",
    },
    {
      title: "Get Noticed",
      desc: "Solve real-world challenges, build skills, and get noticed by top companies.",
      icon: (
        <svg
          className="w-5 h-5 text-[#06B6D4]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
      glow: "border-[#06B6D4]/10 bg-[#071F29]/40 hover:border-[#06B6D4]/30 shadow-[0_0_12px_rgba(6,182,212,0.02)]",
    },
    {
      title: "Collaborative Squads",
      desc: "Join a national squad, pick your domain, and climb to the top together.",
      icon: (
        <svg
          className="w-5 h-5 text-[#FBBF24]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V14a2 2 0 00-2-2h-.5a2 2 0 01-2-2v-1.2c0-.4.3-.7.7-.7h1.4a3 3 0 003-3V5.7A9 9 0 003.055 4v-.065z"
          />
        </svg>
      ),
      glow: "border-[#FBBF24]/10 bg-[#292209]/40 hover:border-[#FBBF24]/30 shadow-[0_0_12px_rgba(251,191,36,0.02)]",
    },
  ];

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-16 border-t border-white/5">
      <h2 className="text-3xl md:text-4xl font-black tracking-wider mb-10 text-left text-white">
        Why <span className="text-[#A78BFA]"><span className="normal-case">µ</span>FIFA</span> Matters
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Stacked Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
          {cards.map((item) => (
            <div
              key={item.title}
              className={`p-6 rounded-2xl bg-[#0D0B21]/50 border ${item.glow} hover:bg-white/[0.02] transition-all duration-300 flex items-start gap-4 text-left`}
            >
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Large Promo Card */}
        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden min-h-[350px] border border-white/10 group flex items-end p-8 text-left shadow-2xl">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 bg-[#0c0a18]/50 z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10 pointer-events-none" />

          {/* Ambient colored background lights */}
          <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-gradient-to-tr from-[#6366F1]/10 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

          <Image
            src="/hero/why.webp"
            alt="Stadium Fans"
            fill
            className="object-cover object-center z-0 transition-transform duration-700 group-hover:scale-105"
          />

          <div className="relative z-20 flex flex-col gap-2 max-w-lg">
            <span className="text-4xl md:text-5xl font-black text-white leading-none">
              66K+
            </span>
            <span className="text-xs font-black text-[#06B6D4] uppercase tracking-wider">
              Kerala Innovators
            </span>

            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              Youth talent across Kerala is largely untapped. μFIFA gives this potential 
              a collaborative structure to surface in front of the companies and institutions 
              that need it most.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
