"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Rewards() {
  const list = [
    {
      title: "Exclusive Trophies",
      desc: "Show off your achievements with exclusive trophies.",
      icon: "/rewards/trophy.webp",
      glow: "border-amber-500/10 bg-[#16120c]/45 shadow-[0_0_15px_rgba(245,158,11,0.02)] hover:border-amber-500/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.12)]",
    },
    {
      title: "Premium Access",
      desc: "Unlock premium events and challenges.",
      icon: "/rewards/ticket.webp",
      glow: "border-purple-500/10 bg-[#130b1c]/45 shadow-[0_0_15px_rgba(168,85,247,0.02)] hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.12)]",
    },
    {
      title: "Cash Prizes",
      desc: "Win exciting cash prizes and rewards.",
      icon: "/rewards/coin.webp",
      glow: "border-yellow-500/10 bg-[#16150c]/45 shadow-[0_0_15px_rgba(234,179,8,0.02)] hover:border-yellow-500/40 hover:shadow-[0_0_25px_rgba(234,179,8,0.12)]",
    },
    {
      title: "Merchandise",
      desc: "Get official merchandise and collectibles.",
      icon: "/rewards/tshirt.webp",
      glow: "border-blue-500/10 bg-[#0c121c]/45 shadow-[0_0_15px_rgba(59,130,246,0.02)] hover:border-blue-500/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.12)]",
    },
    {
      title: "Special Badges",
      desc: "Earn unique badges and stand out.",
      icon: "/rewards/badge.webp",
      glow: "border-emerald-500/10 bg-[#0c1c11]/45 shadow-[0_0_15px_rgba(16,185,129,0.02)] hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]",
    },
  ];

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-white/5">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-left text-white">
          REWARDS & BENEFITS
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 text-center">
        {list.map((item) => (
          <div
            key={item.title}
            className={`p-6 rounded-2xl border ${item.glow} hover:scale-[1.03] transition-all duration-300 flex flex-col items-center justify-center min-h-[240px]`}
          >
            <div className="w-20 h-20 flex items-center justify-center mb-4 transition-transform duration-300">
              <Image
                src={item.icon}
                alt={item.title}
                width={80}
                height={80}
                className="object-contain mix-blend-screen"
              />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2">
              {item.title}
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
