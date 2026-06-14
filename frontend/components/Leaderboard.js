"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getBackendUrl } from "../utils/api";

const FLAGS = {
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
  Portugal: "🇵🇹",
  Germany: "🇩🇪",
  France: "🇫🇷",
  England: "🏴",
  Spain: "🇪🇸",
  Netherlands: "🇳🇱",
  Belgium: "🇧🇪",
  Croatia: "🇭🇷",
  Uruguay: "🇺🇾",
  Japan: "🇯🇵",
};

const TEAMS = Object.keys(FLAGS);

const INITIAL_TEAMS = TEAMS.map((team, idx) => ({
  rank: idx + 1,
  name: team,
  flag: FLAGS[team],
  count: 0,
  points: 0,
  rankTrend: "stable",
}));

export default function Leaderboard() {
  const [teamsData, setTeamsData] = useState(INITIAL_TEAMS);
  const [dbStatus, setDbStatus] = useState("connecting"); // "connecting" | "connected" | "error"
  const [isLiveFeed, setIsLiveFeed] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(getBackendUrl("live-stats"));
        const data = await res.json();
        
        if (res.ok && data.success) {
          setDbStatus("connected");
          const orgs = data.response?.organisation_count || {};
          const pts = data.response?.squad_points || {};

          // Map all 12 teams to their counts and points from live database stats
          const updatedTeams = TEAMS.map((teamName) => ({
            name: teamName,
            flag: FLAGS[teamName],
            count: orgs[teamName] ? Number(orgs[teamName]) : 0,
            points: pts[teamName] ? Number(pts[teamName]) : 0,
          }));

          // Sort by points descending, then by member count, then alphabetically
          updatedTeams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.count !== a.count) return b.count - a.count;
            return a.name.localeCompare(b.name);
          });

          setTeamsData((prev) => {
            return updatedTeams.map((item, idx) => {
              const newRank = idx + 1;
              const prevItem = prev.find((p) => p.name === item.name);
              let rankTrend = "stable";
              if (prevItem) {
                if (newRank < prevItem.rank) rankTrend = "up";
                else if (newRank > prevItem.rank) rankTrend = "down";
                else rankTrend = prevItem.rankTrend || "stable";
              }
              return { rank: newRank, rankTrend, ...item };
            });
          });
          setIsLiveFeed(true);
        } else {
          setDbStatus("error");
          setIsLiveFeed(false);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setDbStatus("error");
        setIsLiveFeed(false);
      }
    };

    fetchStats();
    
    // Poll the stats route every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simulation loop for mock data when live database stats are empty or offline
  useEffect(() => {
    if (isLiveFeed) return;

    setTeamsData((prev) => 
      prev.map((t, idx) => ({
        ...t,
        count: t.count === 0 ? [14, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0][idx] || 0 : t.count,
        points: t.points === 0 ? [140, 120, 100, 80, 70, 60, 50, 40, 30, 20, 10, 0][idx] || 0 : t.points
      }))
    );

    const simInterval = setInterval(() => {
      setTeamsData((prev) => {
        const updated = prev.map((t) => {
          if (Math.random() < 0.3) {
            return { ...t, points: t.points + Math.floor(Math.random() * 10) + 5 };
          }
          return t;
        });

        updated.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.count !== a.count) return b.count - a.count;
          return a.name.localeCompare(b.name);
        });

        return updated.map((item, idx) => {
          const newRank = idx + 1;
          const prevItem = prev.find((p) => p.name === item.name);
          let rankTrend = "stable";
          if (prevItem) {
            if (newRank < prevItem.rank) rankTrend = "up";
            else if (newRank > prevItem.rank) rankTrend = "down";
            else rankTrend = prevItem.rankTrend || "stable";
          }
          return { ...item, rank: newRank, rankTrend };
        });
      });
    }, 6000);

    return () => clearInterval(simInterval);
  }, [isLiveFeed]);

  const getRankStyle = (rank) => {
    if (rank === 1) return "bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]";
    if (rank === 2) return "bg-[#FF2E93]/10 border-[#FF2E93]/30 text-[#FF2E93]";
    if (rank === 3) return "bg-[#7000FF]/10 border-[#7000FF]/30 text-[#7000FF]";
    return "bg-white/5 border-white/10 text-slate-400";
  };

  return (
    <div className="lg:flex-1 bg-glass-card rounded-2xl p-5 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-4 select-none">
      
      {/* Header Area */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            Squad Standings
            <span className="flex items-center gap-1.5 ml-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                dbStatus === "connected" ? "bg-[#00E676] animate-ping" : "bg-[#FF8A00] animate-pulse"
              }`} />
              <span className="text-[8px] font-bold text-slate-300">
                {dbStatus === "connected" ? "LIVE" : "SYNCING"}
              </span>
            </span>
          </h2>
          <p className="text-[9px] text-slate-400 leading-tight">
            {isLiveFeed ? "Live squad points standings" : "Simulated squad standby mode"}
          </p>
        </div>
      </div>

      {/* Leaderboard Rankings List */}
      <div className="flex-grow flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
        {teamsData.map((team) => (
          <div
            key={team.name}
            className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.02] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold border ${getRankStyle(team.rank)}`}>
                  {team.rank}
                </span>
                <div className="w-2.5 flex items-center justify-center">
                  {team.rankTrend === "up" && (
                    <span className="text-[#00E676] text-[9px] drop-shadow-[0_0_2px_#00E676]">▲</span>
                  )}
                  {team.rankTrend === "down" && (
                    <span className="text-[#FF2E93] text-[9px] drop-shadow-[0_0_2px_#FF2E93]">▼</span>
                  )}
                  {team.rankTrend === "stable" && (
                    <span className="text-slate-700 text-[7px]">•</span>
                  )}
                </div>
              </div>

              <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                <span className="text-sm">{team.flag}</span>
                <span>{team.name}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#00E5FF]">{team.points}</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-wider">
                pts
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Standings Link */}
      <div className="pt-2 border-t border-white/5 flex justify-center">
        <Link
          href="/leaderboard"
          className="text-[10px] font-bold uppercase tracking-wider text-[#00E5FF] hover:text-[#00E5FF]/80 transition-colors flex items-center gap-1"
        >
          View Detailed Standings <span className="text-xs">→</span>
        </Link>
      </div>

    </div>
  );
}
