"use client";

import React, { useState } from "react";
import Header from "../tasks/components/Header/Header";
import SquadStandings from "./components/SquadStandings";
import IndividualStandings from "./components/IndividualStandings";
import CollegeStandings from "./components/CollegeStandings";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("squad");
  const [dbStatus, setDbStatus] = useState("connecting");

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10">
      {/* Full-page stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.28] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#030207]/60 via-[#030207]/40 to-[#030207]/80 pointer-events-none" />

      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* Arena Banner with Stadium background */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.30] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.webp')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/50 to-[#030207] z-0 pointer-events-none" />

        <div className="relative z-10">
          <Header
            title={activeTab === "squad" ? "SQUAD" : activeTab === "individual" ? "INDIVIDUAL" : "COLLEGE"}
            highlightedTitle="STANDINGS"
            subtitle={
              activeTab === "squad"
                ? "Live squad points standings in the µFIFA World Cup 2026."
                : activeTab === "individual"
                ? "Real-time player rankings and scorecards."
                : "College-wise aggregate points and member count."
            }
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10 flex-1 flex flex-col gap-6 px-4 md:px-8">
        {/* Tab Selection Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print mt-2">
          <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-full max-w-lg">
            <button
              onClick={() => setActiveTab("squad")}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "squad"
                  ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Squad Standings
            </button>
            <button
              onClick={() => setActiveTab("individual")}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "individual"
                  ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Individual Standings
            </button>
            <button
              onClick={() => setActiveTab("college")}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "college"
                  ? "bg-[#06B6D4] text-white shadow-md shadow-[#06B6D4]/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              College Standings
            </button>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  dbStatus === "connected"
                    ? "bg-[#00E676] animate-ping"
                    : "bg-[#FF8A00] animate-pulse"
                }`}
              />
              <span className="text-[8px] font-bold tracking-wider text-slate-300 uppercase">
                {dbStatus === "connected" ? "LIVE" : "SYNCING"}
              </span>
            </span>
          </div>
        </div>

        {/* Leaderboard Card Container */}
        <div className="bg-glass-card rounded-xl py-5 px-0 border border-white/10 backdrop-blur-md shadow-xl flex flex-col gap-4">
          {activeTab === "squad" && (
            <SquadStandings dbStatus={dbStatus} setDbStatus={setDbStatus} />
          )}
          {activeTab === "individual" && (
            <IndividualStandings />
          )}
          {activeTab === "college" && (
            <CollegeStandings />
          )}
        </div>
      </div>
    </div>
  );
}
