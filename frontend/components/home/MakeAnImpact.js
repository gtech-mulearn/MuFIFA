"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function MakeAnImpact() {
  const cards = [
    {
      title: "Grow the Game",
      desc: "Supporting youth and grassroots football.",
      icon: "/make_an_impact/lock.png",
      glow: "border-[#A78BFA]/10 bg-[#0D0B21]/40 hover:border-[#A78BFA]/30 shadow-[0_0_12px_rgba(167,139,250,0.02)]",
    },
    {
      title: "Stronger Communities",
      desc: "Building opportunities through football.",
      icon: "/make_an_impact/people.png",
      glow: "border-[#06B6D4]/10 bg-[#071F29]/40 hover:border-[#06B6D4]/30 shadow-[0_0_12px_rgba(6,182,212,0.02)]",
    },
    {
      title: "Better Tomorrow",
      desc: "Creating a positive impact for future generations.",
      icon: "/make_an_impact/atom.png",
      glow: "border-[#10B981]/10 bg-[#07241A]/40 hover:border-[#10B981]/30 shadow-[0_0_12px_rgba(16,185,129,0.02)]",
    },
  ];

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-16 border-t border-white/5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: CTA */}
        <div className="lg:col-span-4 text-left flex flex-col justify-start items-start">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider mb-4 leading-tight text-white">
            Make an Impact
          </h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-sm">
            Football unites the world, µFIFA turns your passion into purpose. A part of every reward pool supports grassroots football and community development.
          </p>
          <Link
            href="/community-guidelines"
            className="cursor-pointer text-xs font-black uppercase tracking-widest text-slate-200 hover:text-white border-b-2 border-[#4F46E5] pb-1.5 transition-colors flex items-center gap-1"
          >
            Learn More <span className="text-xs">→</span>
          </Link>
        </div>

        {/* Right Column: 3 Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mt-6 lg:mt-0">
          {cards.map((item) => (
            <div
              key={item.title}
              className={`p-6 rounded-2xl bg-[#0D0B21]/50 border ${item.glow} hover:scale-[1.03] transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[220px]`}
            >
              <div className="w-20 h-20 flex items-center justify-center mb-4">
                <Image
                  src={item.icon}
                  alt={item.title}
                  width={80}
                  height={80}
                  className="object-contain mix-blend-screen"
                />
              </div>
              <h3 className="text-sm font-extrabold text-white mb-2 leading-tight">{item.title}</h3>
              <p className="text-[11px] leading-relaxed text-[#8A8A9E]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

