"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function OurMission() {
  const pillars = [
    {
      title: "Inspire",
      desc: "Inspiring millions through the game.",
      icon: (
        <svg
          className="w-7 h-7 text-violet-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: "Empower",
      desc: "Empowering communities through opportunities.",
      icon: (
        <svg
          className="w-7 h-7 text-cyan-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      title: "Impact",
      desc: "Creating a lasting positive impact.",
      icon: (
        <svg
          className="w-7 h-7 text-emerald-400"
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
    },
  ];

  return (
    <section
      className="relative z-10 w-full py-24 border-t border-b border-white/5 bg-cover bg-center overflow-hidden flex items-center justify-center"
      style={{ backgroundImage: "url('/hero/mission.png')" }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-[#060413]/75 pointer-events-none z-0" />

      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Mission Content */}
        <div className="lg:col-span-5 flex flex-col gap-6 text-left">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
            OUR MISSION
          </h2>
          <p className="text-sm text-slate-200 leading-relaxed mb-2">
            We believe in the power of football to change lives. Our mission is
            to create a platform that combines passion, competition, and purpose
            to build a better future for communities worldwide.
          </p>
          <Link
            href="/community-guidelines"
            className="cursor-pointer bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#5A52FF] hover:to-[#7478FF] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_25px_rgba(79,70,229,0.55)] border border-[#6366F1]/30 inline-block w-fit"
          >
            DISCOVER OUR IMPACT
          </Link>
        </div>

        {/* Right Column: Pillars grid with glassmorphism (2 in a row on mobile) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 lg:pl-8">
          {pillars.map((pill) => (
            <div
              key={pill.title}
              className="flex flex-col items-center justify-center text-center gap-3 p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.05] transition-all duration-300 hover:border-white/12 hover:scale-[1.02] group"
            >
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 transition-colors">
                {pill.icon}
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                {pill.title}
              </h4>
              <p className="text-[11px] leading-relaxed text-[#8A8A9E]">
                {pill.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
