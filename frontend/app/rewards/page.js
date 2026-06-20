"use client";
import React from "react";
import Link from "next/link";
import Header from "@/app/tasks/components/Header/Header";
import { usePlayer } from "@/components/PlayerContext";

export default function RewardsPage() {
  const { loading } = usePlayer();
  const rewardsList = [
    {
      id: 1,
      title: "Match Day Ticket",
      description:
        "Redeem your points for official match entry passes and stadium seating.",
      cost: 100,
      icon: (
        <svg
          className="w-8 h-8 text-amber-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12h12c1.105 0 2 .895 2 2v8c0 1.105-.895 2-2 2H7.5a2 2 0 01-2-2V8a2 2 0 012-2z"
          />
        </svg>
      ),
      tag: "STADIUM ACCESS",
    },
    {
      id: 2,
      title: "Avatar Glow Frame",
      description:
        "Customize your profile card avatar with an exclusive animated neon ring.",
      cost: 50,
      icon: (
        <svg
          className="w-8 h-8 text-cyan-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="9" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 21l5-3 5 3-1.523-9.11"
          />
        </svg>
      ),
      tag: "PROFILE CUSTOMIZATION",
    },
    {
      id: 3,
      title: "Discord Elite Role",
      description:
        "Unlock the exclusive 'Elite Tactician' role and private channel access.",
      cost: 30,
      icon: (
        <svg
          className="w-8 h-8 text-indigo-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084-.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
        </svg>
      ),
      tag: "COMMUNITY PERK",
    },
    {
      id: 4,
      title: "Gold Card Special",
      description:
        "Upgrade your Player Card to a glowing metallic gold background design.",
      cost: 40,
      icon: (
        <svg
          className="w-8 h-8 text-fuchsia-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 21l5-3 5 3-1.523-9.11M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      tag: "CARD STYLING",
    },
  ];

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#05030a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10 px-4 sm:px-6 md:px-8">
      {/* Full-page stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.28] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#030207]/60 via-[#030207]/40 to-[#030207]/80 pointer-events-none" />

      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* HEADER */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.30] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.webp')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/50 to-[#030207] z-0 pointer-events-none" />

        <div className="relative z-10">
          <Header
            title="REWARDS"
            highlightedTitle="MARKETPLACE"
            subtitle="Claim real-life match tickets, profile cosmetic upgrades, and digital assets."
          />
        </div>
      </div>

      {/* REWARDS GRID */}
      <div className="relative z-10 flex flex-col gap-6 mt-2">
        <h2 className="text-sm font-black uppercase tracking-[0.25em] text-white">
          AVAILABLE REWARDS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rewardsList.map((reward) => (
            <div
              key={reward.id}
              className="bg-gradient-to-b from-[#110e24]/90 to-[#070613]/90 border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between h-56 select-none group"
            >
              {/* Card Header & Content (Blurred) */}
              <div className="flex gap-4 items-start blur-[3px] pointer-events-none">
                <div className="w-14 h-14 rounded-full border border-violet-500/25 bg-violet-500/5 flex items-center justify-center text-white shadow-lg shrink-0">
                  {reward.icon}
                </div>
                <div className="flex flex-col gap-1 text-left min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-wider text-violet-400">
                    {reward.tag}
                  </span>
                  <h3 className="text-base font-black tracking-wide uppercase leading-tight text-white mt-0.5">
                    {reward.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                    {reward.description}
                  </p>
                </div>
              </div>

              {/* Card Footer (Blurred) */}
              <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4 mt-auto blur-[3px] pointer-events-none">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Status
                </span>
                <div className="border border-violet-500/20 bg-violet-500/5 text-violet-400 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 select-none">
                  <span className="text-xs font-black tracking-tight leading-none">
                    {reward.cost}
                  </span>
                  <span className="text-[7.5px] font-black tracking-wider">
                    μPoints
                  </span>
                </div>
              </div>

              {/* Glassmorphic Coming Soon Center Overlay */}
              <div className="absolute inset-0 bg-[#090715]/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5 z-10 select-none">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/35 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)] animate-pulse">
                  <svg
                    className="w-5.5 h-5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">
                  Coming Soon
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
