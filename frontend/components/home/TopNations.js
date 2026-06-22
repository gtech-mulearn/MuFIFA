"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getBackendUrl } from "@/utils/api";

const FLAGS = {
  Brazil: "br",
  Argentina: "ar",
  Portugal: "pt",
  Germany: "de",
  France: "fr",
  England: "gb-eng",
  Spain: "es",
  Netherlands: "nl",
  Belgium: "be",
  Croatia: "hr",
  Uruguay: "uy",
  Japan: "jp",
};

export default function TopNations() {
  const [nations, setNations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopNations = async () => {
      try {
        const res = await fetch(getBackendUrl("live-stats"));
        const data = await res.json();
        if (res.ok && data.success) {
          const pts = data.response?.squad_points || {};
          const orgs = data.response?.organisation_count || {};

          const list = Object.keys(FLAGS).map((name) => ({
            name,
            flag: FLAGS[name],
            points: pts[name] ? Number(pts[name]) : 0,
            count: orgs[name] ? Number(orgs[name]) : 0,
          }));

          list.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.count !== a.count) return b.count - a.count;
            return a.name.localeCompare(b.name);
          });

          setNations(list.slice(0, 5));
        }
      } catch (err) {
        console.error("Error fetching top nations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopNations();
  }, []);

  const formatPoints = (num) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num;
  };

  const getFlagBg = (name) => {
    const key = name.toLowerCase();
    if (key === "croatia") return "/playerCard/flag/crotia.webp";
    if (key === "netherlands") return "/playerCard/flag/netherlands.webp";
    return `/playerCard/flag/${key}.webp`;
  };

  const getRankText = (rank) => {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `${rank}th`;
  };

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return "bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] border-transparent text-[#0A071E] shadow-[0_2px_8px_rgba(251,191,36,0.3)]";
    if (rank === 2) return "bg-gradient-to-r from-[#E2E8F0] to-[#94A3B8] border-transparent text-[#0A071E] shadow-[0_2px_8px_rgba(148,163,184,0.2)]";
    if (rank === 3) return "bg-gradient-to-r from-[#FDBA74] to-[#C2410C] border-transparent text-white shadow-[0_2px_8px_rgba(194,65,12,0.2)]";
    return "bg-black/60 border-white/10 text-slate-300";
  };

  const getCardBorder = (rank) => {
    if (rank === 1) return "border-[#FBBF24]/50 shadow-[0_4px_20px_rgba(251,191,36,0.15)]";
    if (rank === 2) return "border-[#94A3B8]/50 shadow-[0_4px_20px_rgba(148,163,184,0.1)]";
    if (rank === 3) return "border-[#D97706]/50 shadow-[0_4px_20px_rgba(217,119,6,0.1)]";
    return "border-white/15 hover:border-white/35 shadow-[0_4px_20px_rgba(0,0,0,0.3)]";
  };

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-white/5">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-left">
          TOP NATIONS
        </h2>
        <Link
          href="/leaderboard"
          className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[#06B6D4] hover:text-[#06B6D4]/80 transition-colors flex items-center gap-1"
        >
          SEE ALL NATIONS <span className="text-sm">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-left">
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[250px] bg-white/5 border border-white/5 rounded-2xl animate-pulse"
            />
          ))
        ) : nations.length > 0 ? (
          nations.map((team, idx) => {
            const rank = idx + 1;
            return (
              <div
                key={team.name}
                className={`relative w-full h-[250px] rounded-2xl overflow-hidden border ${getCardBorder(rank)} flex flex-col justify-between p-6 hover:scale-[1.04] transition-all duration-300 group`}
              >
                {/* Flag Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${getFlagBg(team.name)}')` }}
                />

                {/* Dark Overlays for text contrast */}
                <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A071E] via-[#0A071E]/40 to-transparent z-10 pointer-events-none" />

                {/* Rank Badge */}
                <div className="relative z-20">
                  <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getRankBadgeStyle(rank)}`}>
                    {getRankText(rank)}
                  </span>
                </div>

                {/* Country Info & Points */}
                <div className="relative z-20 flex flex-col min-w-0">
                  <span className="text-lg font-black text-white uppercase tracking-wide truncate">
                    {team.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-black text-[#06B6D4] drop-shadow-[0_2px_4px_rgba(6,182,212,0.25)]">
                      {formatPoints(team.points)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                      µPoints
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-slate-500 text-xs py-4 text-center col-span-5">
            No standings data available.
          </div>
        )}
      </div>
    </section>
  );
}
