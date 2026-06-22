"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getBackendUrl } from "@/utils/api";

const FLAGS = {
  Argentina: "ar",
  Brazil: "br",
  France: "fr",
  Portugal: "pt",
  Spain: "es",
};

export default function Hero() {
  const [squads, setSquads] = useState([
    { name: "Argentina", flag: "ar", points: 25400 },
    { name: "Brazil", flag: "br", points: 24320 },
    { name: "France", flag: "fr", points: 22900 },
    { name: "Portugal", flag: "pt", points: 19870 },
    { name: "Spain", flag: "es", points: 18230 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopSquads = async () => {
      try {
        const res = await fetch(getBackendUrl("live-stats"));
        const data = await res.json();
        if (res.ok && data.success) {
          const pts = data.response?.squad_points || {};
          const list = Object.keys(FLAGS).map((name) => ({
            name,
            flag: FLAGS[name],
            points: pts[name]
              ? Number(pts[name])
              : squads.find((s) => s.name === name).points,
          }));

          list.sort((a, b) => b.points - a.points);
          setSquads(list);
        }
      } catch (err) {
        console.error("Error fetching top squads:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopSquads();
  }, []);

  return (
    <section
      className="relative z-10 w-full lg:h-screen min-h-screen lg:max-h-screen flex items-center justify-center bg-cover bg-center overflow-hidden py-12 lg:py-0"
      style={{ backgroundImage: "url('/hero/hero.webp')" }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-[#060413]/30 pointer-events-none z-0" />

      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-20 md:pt-24 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center lg:h-full z-10 relative">
        {/* Left Column: CTA */}
        <div className="lg:col-span-5 flex flex-col justify-center text-left">
          <h1 className="text-[3rem] sm:text-[3.5rem] md:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.95] uppercase mb-5 text-white">
            <span className="block">Represent</span>
            <span className="block text-slate-100">Your Nation.</span>
            <span className="block bg-gradient-to-r from-[#A78BFA] to-[#C084FC] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(167,139,250,0.35)] mt-1">
              Compete
            </span>
            <span className="block bg-gradient-to-r from-[#A78BFA] to-[#C084FC] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(167,139,250,0.35)]">
              Together.
            </span>
            <span className="block bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent mt-1 drop-shadow-[0_0_30px_rgba(251,191,36,0.2)]">
              Lift The Cup.
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-md mb-8 leading-relaxed font-medium">
            Join millions of players worldwide in the ultimate football
            challenge. Earn µPoints, climb the leaderboard, and make your nation
            world champions.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/register"
              className="cursor-pointer w-full sm:w-auto bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white px-8 py-3.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest hover:from-[#5A52FF] hover:to-[#7478FF] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(79,70,229,0.35)] hover:shadow-[0_4px_30px_rgba(79,70,229,0.55)] border border-[#6366F1]/30 flex items-center justify-center gap-2"
            >
              Join The Arena
              <span className="text-xs">→</span>
            </Link>
            <Link
              href="/leaderboard"
              className="cursor-pointer w-full sm:w-auto bg-[#0D111C]/70 hover:bg-[#161F30]/90 text-white px-8 py-3.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/15 hover:border-white/35 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
            >
              View Leaderboard
            </Link>
          </div>
        </div>

        {/* Right Column: Standings panel */}
        <div className="lg:col-span-7 lg:col-start-10 flex flex-col justify-center">
          <div className="bg-[#0A071E]/65 rounded-2xl p-5 border border-[#3B2D6C]/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-200">
                Live World Cup Race
              </span>
              <div className="flex items-center gap-1.5 bg-[#EF4444]/10 border border-[#EF4444]/25 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                <span className="text-[8px] md:text-[9px] font-black text-[#EF4444] uppercase tracking-widest">
                  Live
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {squads.map((team, idx) => {
                let rankBadgeClass = "";
                if (idx === 0) {
                  rankBadgeClass =
                    "bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] text-black font-black shadow-[0_0_8px_rgba(251,191,36,0.4)] border border-[#FCD34D]/35";
                } else if (idx === 1) {
                  rankBadgeClass =
                    "bg-gradient-to-br from-[#E2E8F0] to-[#94A3B8] text-black font-black shadow-[0_0_8px_rgba(148,163,184,0.35)] border border-[#F1F5F9]/30";
                } else if (idx === 2) {
                  rankBadgeClass =
                    "bg-gradient-to-br from-[#FDBA74] to-[#C2410C] text-black font-black shadow-[0_0_8px_rgba(194,65,12,0.35)] border border-[#FED7AA]/35";
                } else {
                  rankBadgeClass =
                    "bg-white/5 border border-white/10 text-slate-300 font-bold";
                }
                return (
                  <div
                    key={team.name}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.003] hover:bg-white/[0.025] hover:border-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] shrink-0 ${rankBadgeClass}`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs md:text-sm font-bold text-slate-200 flex items-center gap-2">
                        <span
                          className={`fi fi-${team.flag} rounded-sm shadow-sm border border-white/10 shrink-0`}
                          style={{ width: "18px", height: "13.5px" }}
                        />
                        {team.name}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 bg-[#1A163B]/40 px-2 py-1 rounded-lg border border-[#3B2D6C]/20 shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]">
                      <span className="text-xs md:text-sm font-black text-white">
                        {team.points.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        Pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/10">
              <Link
                href="/leaderboard"
                className="cursor-pointer w-full bg-[#1A163B]/60 hover:bg-[#252059]/80 border border-[#3B2D6C]/50 hover:border-[#4C3B8B] text-slate-200 hover:text-white py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(79,70,229,0.25)]"
              >
                <span>View Full Leaderboard</span>
                <span className="text-xs">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
