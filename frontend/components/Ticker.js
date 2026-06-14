"use client";

import React, { useState, useEffect, useRef } from "react";
import { getBackendUrl } from "../utils/api";

const TEAM_METADATA = {
  Brazil: { code: "BRA", flag: "🇧🇷", baseShare: 0.0 },
  Argentina: { code: "ARG", flag: "🇦🇷", baseShare: 0.0 },
  Portugal: { code: "POR", flag: "🇵🇹", baseShare: 0.0 },
  Germany: { code: "GER", flag: "🇩🇪", baseShare: 0.0 },
  France: { code: "FRA", flag: "🇫🇷", baseShare: 0.0 },
  England: { code: "ENG", flag: "EN", baseShare: 0.0 },
  Spain: { code: "ESP", flag: "🇪🇸", baseShare: 0.0 },
  Netherlands: { code: "NED", flag: "🇳🇱", baseShare: 0.0 },
  Belgium: { code: "BEL", flag: "🇧🇪", baseShare: 0.0 },
  Croatia: { code: "CRO", flag: "🇭🇷", baseShare: 0.0 },
  Uruguay: { code: "URU", flag: "🇺🇾", baseShare: 0.0 },
  Japan: { code: "JPN", flag: "🇯🇵", baseShare: 0.0 },
};

const TEAMS = Object.keys(TEAM_METADATA);

const INITIAL_TEAMS = TEAMS.map((team, idx) => ({
  name: team,
  code: TEAM_METADATA[team].code,
  flag: TEAM_METADATA[team].flag,
  share: TEAM_METADATA[team].baseShare,
  prevShare: TEAM_METADATA[team].baseShare,
  trend: "stable",
  rank: idx + 1,
}));

export default function Ticker() {
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [toasts, setToasts] = useState([]);
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const toastIdRef = useRef(0);

  // Poll live registration data from the backend proxy to calculate shares
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(getBackendUrl("live-stats"));
        const data = await res.json();
        
        if (res.ok && data.success) {
          const orgs = data.response?.organisation_count || {};
          
          // Calculate total registrations to compute share percentages
          const totalRegs = Object.values(orgs).reduce((sum, val) => sum + Number(val), 0);

          let updatedTeams;

          if (totalRegs > 0) {
            // Calculate actual percentage shares from database registrations
            updatedTeams = TEAMS.map((teamName) => {
              const count = orgs[teamName] ? Number(orgs[teamName]) : 0;
              const share = Math.round((count / totalRegs) * 100 * 10) / 10;
              return {
                name: teamName,
                code: TEAM_METADATA[teamName].code,
                flag: TEAM_METADATA[teamName].flag,
                share,
              };
            });
          } else {
            // Fallback to base shares if total registrations are 0
            updatedTeams = TEAMS.map((teamName) => ({
              name: teamName,
              code: TEAM_METADATA[teamName].code,
              flag: TEAM_METADATA[teamName].flag,
              share: TEAM_METADATA[teamName].baseShare,
            }));
          }

          // Sort descending by share percentage
          updatedTeams.sort((a, b) => b.share - a.share || a.name.localeCompare(b.name));

          setTeams((prev) => {
            const nextTeams = updatedTeams.map((t, idx) => {
              const newRank = idx + 1;
              const prevItem = prev.find((p) => p.name === t.name);
              let trend = "stable";
              let prevShare = t.share;

              if (prevItem) {
                prevShare = prevItem.share;
                if (t.share > prevItem.share) trend = "up";
                else if (t.share < prevItem.share) trend = "down";
                else trend = prevItem.trend || "stable";

                // Detect rank overtaking
                if (newRank < prevItem.rank) {
                  const overtakenTeam = prev.find((pt) => pt.rank === newRank);
                  if (overtakenTeam && overtakenTeam.name !== t.name) {
                    const toastId = ++toastIdRef.current;
                    const newToast = {
                      id: toastId,
                      message: `🔥 ${t.flag} ${t.name} has overtaken ${overtakenTeam.flag} ${overtakenTeam.name} for Rank ${newRank}!`,
                    };
                    setToasts((p) => [newToast, ...p].slice(0, 3));
                    setTimeout(() => {
                      setToasts((p) => p.filter((toast) => toast.id !== toastId));
                    }, 4500);
                  }
                }
              }

              return {
                ...t,
                prevShare,
                trend,
                rank: newRank,
              };
            });
            return nextTeams;
          });
          setIsLiveFeed(true);
        } else {
          setIsLiveFeed(false);
        }
      } catch (err) {
        console.error("Error fetching stats for ticker:", err);
        setIsLiveFeed(false);
      }
    };

    fetchStats();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-black/60 border-y border-white/5 backdrop-blur-md relative z-40 overflow-hidden py-2 text-xs font-semibold select-none mt-[72px] md:mt-[88px] no-print">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Marquee Body with shrink-0 container to fix scrolling compression */}
      <div className="overflow-hidden flex w-full">
        <div className="animate-marquee shrink-0 flex items-center gap-8 pr-8">
          {[...teams, ...teams].map((team, idx) => {
            const isUp = team.trend === "up";
            const isDown = team.trend === "down";
            return (
              <div
                key={`${team.code}-${idx}`}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-200"
              >
                <span className="text-[10px] text-slate-500 font-bold">#{team.rank}</span>
                <span>{team.flag}</span>
                <span className="font-extrabold tracking-wide uppercase text-[11px]">
                  {team.code}
                </span>
                <span className="text-slate-100 font-bold">{team.share.toFixed(1)}%</span>
                {isUp && (
                  <span className="text-[#00E676] animate-pulse drop-shadow-[0_0_4px_#00E676] text-[10px]">
                    ▲
                  </span>
                )}
                {isDown && (
                  <span className="text-[#FF2E93] animate-pulse drop-shadow-[0_0_4px_#FF2E93] text-[10px]">
                    ▼
                  </span>
                )}
                {team.trend === "stable" && (
                  <span className="text-slate-600 text-[9px]">•</span>
                )}
                <span className="text-white/10 px-1 font-light">|</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Alerts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm pointer-events-none w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#080c16]/95 border border-[#00E5FF]/30 rounded-xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between gap-3 text-slate-100 text-xs font-bold animate-slideInRight select-none relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#00E5FF] to-[#FF2E93]" />
            <div className="flex-1 pl-2">
              <span className="text-[9px] tracking-wider text-[#00E5FF] uppercase block mb-0.5">
                // Overtaking Alert //
              </span>
              <p className="text-slate-100 font-semibold">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
