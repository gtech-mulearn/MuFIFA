"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import BackgroundVideo from "@/components/BackgroundVideo";

const FLAGS = {
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
  Portugal: "🇵🇹",
  Germany: "🇩🇪",
  France: "🇫🇷",
  England: "EN",
  Spain: "🇪🇸",
  Netherlands: "🇳🇱",
  Belgium: "🇧🇪",
  Croatia: "🇭🇷",
  Uruguay: "🇺🇾",
  Japan: "🇯🇵",
};

const TEAMS = Object.keys(FLAGS);

// Initial state with counts set to 0
const INITIAL_TEAMS = TEAMS.map((team, idx) => ({
  rank: idx + 1,
  name: team,
  flag: FLAGS[team],
  count: 0,
  rankTrend: "stable",
}));

export default function LeaderboardPage() {
  const [teamsData, setTeamsData] = useState(INITIAL_TEAMS);
  const [dbStatus, setDbStatus] = useState("connecting"); // "connecting" | "connected" | "error"
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/proxy?path=live-stats");
        const data = await res.json();

        if (res.ok && data.success) {
          setDbStatus("connected");
          const orgs = data.response?.organisation_count || {};

          // Map all 12 teams to their counts from live database stats
          const updatedTeams = TEAMS.map((teamName) => ({
            name: teamName,
            flag: FLAGS[teamName],
            count: orgs[teamName] ? Number(orgs[teamName]) : 0,
          }));

          // Sort by registrations descending, then alphabetically
          updatedTeams.sort((a, b) => {
            if (b.count !== a.count) {
              return b.count - a.count;
            }
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

    // Initialize counts to simulate starting updates
    setTeamsData((prev) =>
      prev.map((t, idx) => ({
        ...t,
        count:
          t.count === 0
            ? [14, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0][idx] || 0
            : t.count,
      })),
    );

    const simInterval = setInterval(() => {
      setTeamsData((prev) => {
        const updated = prev.map((t) => {
          if (Math.random() < 0.3) {
            return { ...t, count: t.count + Math.floor(Math.random() * 2) + 1 };
          }
          return t;
        });

        updated.sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
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

  const filteredTeams = teamsData.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getRankStyle = (rank) => {
    if (rank === 1) return "bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]";
    if (rank === 2) return "bg-[#FF2E93]/10 border-[#FF2E93]/30 text-[#FF2E93]";
    if (rank === 3) return "bg-[#7000FF]/10 border-[#7000FF]/30 text-[#7000FF]";
    return "bg-white/5 border-white/10 text-slate-400";
  };

  return (
    <div className="w-full min-h-screen bg-[#04060d] text-white flex flex-col font-sans relative select-none pb-16 pt-8 md:pt-12">
      <BackgroundVideo />

      {/* Clean dark backdrop with no unusual colorful gradients */}
      <div className="absolute inset-0 z-0 bg-[#04060d]/85 pointer-events-none" />

      <div className="max-w-2xl mx-auto px-6 w-full relative z-10 flex-1 flex flex-col gap-6">
        {/* Header and Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wide text-white uppercase">
                Squad Standings
              </h1>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    dbStatus === "connected"
                      ? "bg-[#00E676] animate-ping"
                      : "bg-[#FF8A00] animate-pulse"
                  }`}
                />
                <span className="text-[8px] font-bold tracking-wider text-slate-300">
                  {dbStatus === "connected" ? "LIVE" : "SYNCING"}
                </span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {isLiveFeed
                ? "Live registration count per country"
                : "Simulated squad standby mode"}
            </p>
          </div>
          <Link
            href="/"
            className="cursor-pointer bg-glass border border-white/10 hover:border-white/25 px-4 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
          >
            Back to lobby
          </Link>
        </div>

        {/* Squad Leaderboard Card */}
        <div className="bg-glass-card rounded-xl p-5 border border-white/10 backdrop-blur-md shadow-xl flex flex-col gap-4">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search squad country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#00E5FF] w-full transition-colors"
          />

          {/* Leaderboard Table List */}
          <div className="flex flex-col gap-2">
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => (
                <div
                  key={team.name}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.005] hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Indicator */}
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold border ${getRankStyle(team.rank)}`}
                    >
                      {team.rank}
                    </span>

                    {/* Trend Indicator */}
                    <div className="w-3 flex items-center justify-center">
                      {team.rankTrend === "up" && (
                        <span className="text-[#00E676] text-[10px] drop-shadow-[0_0_2px_#00E676]">
                          ▲
                        </span>
                      )}
                      {team.rankTrend === "down" && (
                        <span className="text-[#FF2E93] text-[10px] drop-shadow-[0_0_2px_#FF2E93]">
                          ▼
                        </span>
                      )}
                      {team.rankTrend === "stable" && (
                        <span className="text-slate-700 text-[8px]">•</span>
                      )}
                    </div>

                    {/* Team Flag & Name */}
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-2">
                      <span className="text-sm">{team.flag}</span>
                      <span>{team.name}</span>
                    </span>
                  </div>

                  {/* Registrations Count */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100">
                      {team.count}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                      squad members
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs font-bold border border-white/5 rounded-lg bg-white/[0.005]">
                No squad matches your search query.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
