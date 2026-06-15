"use client";

import React, { useState, useEffect, useRef } from "react";
import { getBackendUrl } from "../utils/api";

const TEAM_METADATA = {
  Brazil: { code: "BRA", flag: "🇧🇷", flagCode: "br", baseShare: 0.0 },
  Argentina: { code: "ARG", flag: "🇦🇷", flagCode: "ar", baseShare: 0.0 },
  Portugal: { code: "POR", flag: "🇵🇹", flagCode: "pt", baseShare: 0.0 },
  Germany: { code: "GER", flag: "🇩🇪", flagCode: "de", baseShare: 0.0 },
  France: { code: "FRA", flag: "🇫🇷", flagCode: "fr", baseShare: 0.0 },
  England: { code: "ENG", flag: "EN", flagCode: "gb-eng", baseShare: 0.0 },
  Spain: { code: "ESP", flag: "🇪🇸", flagCode: "es", baseShare: 0.0 },
  Netherlands: { code: "NED", flag: "🇳🇱", flagCode: "nl", baseShare: 0.0 },
  Belgium: { code: "BEL", flag: "🇧🇪", flagCode: "be", baseShare: 0.0 },
  Croatia: { code: "CRO", flag: "🇭🇷", flagCode: "hr", baseShare: 0.0 },
  Uruguay: { code: "URU", flag: "🇺🇾", flagCode: "uy", baseShare: 0.0 },
  Japan: { code: "JPN", flag: "🇯🇵", flagCode: "jp", baseShare: 0.0 },
};

const TEAMS = Object.keys(TEAM_METADATA);

const INITIAL_TEAMS = TEAMS.map((team, idx) => ({
  name: team,
  code: TEAM_METADATA[team].code,
  flag: TEAM_METADATA[team].flag,
  flagCode: TEAM_METADATA[team].flagCode,
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
                flagCode: TEAM_METADATA[teamName].flagCode,
                share,
              };
            });
          } else {
            // Fallback to base shares if total registrations are 0
            updatedTeams = TEAMS.map((teamName) => ({
              name: teamName,
              code: TEAM_METADATA[teamName].code,
              flag: TEAM_METADATA[teamName].flag,
              flagCode: TEAM_METADATA[teamName].flagCode,
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
                      teamName: t.name,
                      teamFlagCode: t.flagCode,
                      overtakenName: overtakenTeam.name,
                      overtakenFlagCode: overtakenTeam.flagCode,
                      newRank,
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
                <span className={`fi fi-${team.flagCode} rounded-sm shadow-sm border border-white/10 shrink-0`} style={{ width: '16px', height: '12px' }} role="img" aria-label={`${team.code} flag`} />
                <span className="font-extrabold tracking-wide uppercase text-[11px]">
                  {team.code}
                </span>
                <span className="text-slate-100 font-bold">{team.share.toFixed(1)}%</span>
                {isUp && (
                  <span className="text-[#00E676] animate-pulse drop-shadow-[0_0_4px_#00E676] text-[10px]" aria-label="Rank increased">
                    ▲
                  </span>
                )}
                {isDown && (
                  <span className="text-[#4F46E5] animate-pulse drop-shadow-[0_0_4px_#4F46E5] text-[10px]" aria-label="Rank decreased">
                    ▼
                  </span>
                )}
                {team.trend === "stable" && (
                  <span className="text-slate-600 text-[9px]" aria-label="Rank stable">•</span>
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
            className="pointer-events-auto bg-[#131927]/95 border border-[#06B6D4]/30 rounded-xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between gap-3 text-slate-100 text-xs font-bold animate-slideInRight select-none relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#06B6D4] to-[#4F46E5]" />
            <div className="flex-1 pl-2">
              <span className="text-[9px] tracking-wider text-[#06B6D4] uppercase block mb-0.5">
                // Overtaking Alert //
              </span>
              <p className="text-slate-100 font-semibold flex items-center gap-1.5 flex-wrap">
                🔥 
                <span className={`fi fi-${toast.teamFlagCode} rounded-sm shadow-sm border border-white/10 shrink-0`} style={{ width: '15px', height: '11.5px' }} role="img" aria-label={`${toast.teamName} flag`} />
                <span>{toast.teamName}</span>
                <span className="text-slate-400 font-medium">has overtaken</span>
                <span className={`fi fi-${toast.overtakenFlagCode} rounded-sm shadow-sm border border-white/10 shrink-0`} style={{ width: '15px', height: '11.5px' }} role="img" aria-label={`${toast.overtakenName} flag`} />
                <span>{toast.overtakenName}</span>
                <span className="text-slate-400 font-medium">for Rank</span>
                <span className="text-[#06B6D4]">{toast.newRank}!</span>
              </p>
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
