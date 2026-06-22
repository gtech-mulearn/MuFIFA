"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getBackendUrl } from "@/utils/api";
import Header from "../tasks/components/Header/Header";

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

const TEAMS = Object.keys(FLAGS);

const SQUAD_PHOTOS = {
  Brazil: "/players/brazil_back.svg",
  Argentina: "/players/argentina_back.svg",
  Portugal: "/players/portugal_back.svg",
};

const getSquadPhoto = (teamName) => {
  if (SQUAD_PHOTOS[teamName]) return SQUAD_PHOTOS[teamName];
  const formatted = teamName.toLowerCase().replace(/\s+/g, "_");
  return `/players/${formatted}_front.svg`;
};

const INITIAL_TEAMS = TEAMS.map((team, idx) => ({
  rank: idx + 1,
  name: team,
  flag: FLAGS[team],
  count: 0,
  points: 0,
  rankTrend: "stable",
}));

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("squad"); // "squad" | "individual"

  // Squad Standings State
  const [teamsData, setTeamsData] = useState(INITIAL_TEAMS);
  const [dbStatus, setDbStatus] = useState("connecting"); // "connecting" | "connected" | "error"
  const [searchQuery, setSearchQuery] = useState("");

  // Individual Standings State
  const [playersData, setPlayersData] = useState([]);
  const [playersSearchQuery, setPlayersSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [playersSortOrder, setPlayersSortOrder] = useState("desc"); // "desc" | "asc"
  const [teamFilter, setTeamFilter] = useState("All");
  const [playersLoading, setPlayersLoading] = useState(false);
  const [hasMorePlayers, setHasMorePlayers] = useState(false);

  // Debounce search query to reduce Supabase queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(playersSearchQuery);
    }, 450);
    return () => clearTimeout(timer);
  }, [playersSearchQuery]);

  // Fetch Squad Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(getBackendUrl("live-stats"));
        const data = await res.json();

        if (res.ok && data.success) {
          setDbStatus("connected");
          const orgs = data.response?.organisation_count || {};
          const pts = data.response?.squad_points || {};

          const updatedTeams = TEAMS.map((teamName) => ({
            name: teamName,
            flag: FLAGS[teamName],
            count: orgs[teamName] ? Number(orgs[teamName]) : 0,
            points: pts[teamName] ? Number(pts[teamName]) : 0,
          }));

          // Sort squads
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
        } else {
          setDbStatus("error");
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setDbStatus("error");
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Individual Standings from API
  const fetchPlayers = useCallback(async (offset, reset = false) => {
    setPlayersLoading(true);
    try {
      const res = await fetch(
        `/api/v1/leaderboard/individuals?limit=12&offset=${offset}&search=${encodeURIComponent(debouncedSearchQuery)}&sort=${playersSortOrder}&team=${encodeURIComponent(teamFilter)}`,
      );
      const data = await res.json();
      if (res.ok && data.success) {
        if (reset) {
          setPlayersData(data.data);
        } else {
          setPlayersData((prev) => [...prev, ...data.data]);
        }
        setHasMorePlayers(data.pagination.hasMore);
      }
    } catch (err) {
      console.error("Failed to fetch players:", err);
    } finally {
      setPlayersLoading(false);
    }
  }, [debouncedSearchQuery, playersSortOrder, teamFilter]);

  // Load players on tab switch, sort order change, or query change
  useEffect(() => {
    let active = true;
    if (activeTab === "individual") {
      Promise.resolve().then(() => {
        if (active) {
          fetchPlayers(0, true);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [activeTab, fetchPlayers]);

  // Filter Squads Client-side
  const filteredTeams = useMemo(() => {
    return teamsData.filter((team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamsData, searchQuery]);

  const getRankStyle = (rank) => {
    if (rank === 1)
      return "bg-[#FBBF24]/10 border-[#FBBF24]/30 text-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.15)]";
    if (rank === 2)
      return "bg-[#94A3B8]/10 border-[#94A3B8]/30 text-[#E2E8F0] shadow-[0_0_8px_rgba(148,163,184,0.15)]";
    if (rank === 3) return "bg-[#D97706]/10 border-[#D97706]/30 text-[#F97316]";
    return "bg-white/5 border-white/10 text-slate-400";
  };

  const getInitials = (name) => {
    if (!name) return "⚽";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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

      {/* TOP N ARENA BANNER (with stadium background) */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10">
        {/* Stadium background overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.30] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.webp')` }}
        />
        {/* Dark gradient overlay to fade at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/50 to-[#030207] z-0 pointer-events-none" />

        {/* HEADER */}
        <div className="relative z-10">
          <Header
            title={activeTab === "squad" ? "SQUAD" : "INDIVIDUAL"}
            highlightedTitle="STANDINGS"
            subtitle={
              activeTab === "squad"
                ? "Live squad points standings in the µFIFA World Cup 2026."
                : "Real-time player rankings and scorecards."
            }
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10 flex-1 flex flex-col gap-6 px-4 md:px-8">
        {/* Tab Selection Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print mt-2">
          <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-full max-w-sm">
            <button
              onClick={() => {
                setActiveTab("squad");
                setSearchQuery("");
              }}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "squad"
                  ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Squad Standings
            </button>
            <button
              onClick={() => {
                setActiveTab("individual");
                setPlayersSearchQuery("");
                setDebouncedSearchQuery("");
                setTeamFilter("All");
              }}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "individual"
                  ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Individual Standings
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

        {/* Leaderboard Card */}
        <div className="bg-glass-card rounded-xl py-5 px-0 border border-white/10 backdrop-blur-md shadow-xl flex flex-col gap-4">
          {/* SEARCH & SORTING BAR */}
          <div className="px-2 sm:px-3">
            {activeTab === "squad" ? (
              <input
                type="text"
                placeholder="Search squad country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] w-full transition-colors"
              />
            ) : (
              <div className="flex gap-2 w-full flex-wrap sm:flex-nowrap">
                <input
                  type="text"
                  placeholder="Search player name or @username..."
                  value={playersSearchQuery}
                  onChange={(e) => setPlayersSearchQuery(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] flex-1 transition-colors min-w-[200px]"
                />
                
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="px-4 py-2 bg-gradient-to-r from-[#1a1438]/80 to-[#110e20]/80 border border-violet-500/30 hover:border-violet-400/50 rounded-lg text-xs font-black uppercase tracking-wider text-violet-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all cursor-pointer shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.1)] outline-none"
                >
                  <option value="All" className="bg-[#0f0c1b] text-violet-300 font-black">ALL SQUADS</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t} className="bg-[#0f0c1b] text-slate-200 font-bold uppercase">{t}</option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    setPlayersSortOrder((prev) =>
                      prev === "desc" ? "asc" : "desc",
                    )
                  }
                  className="px-3 py-2 bg-black/40 border border-white/10 hover:border-white/20 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  Score:{" "}
                  {playersSortOrder === "desc"
                    ? "High to Low ↓"
                    : "Low to High ↑"}
                </button>
              </div>
            )}
          </div>

          {/* STANDINGS TABLE LIST */}
          <div className="flex flex-col">
            {activeTab === "squad" &&
              !searchQuery &&
              dbStatus !== "connecting" &&
              teamsData.length >= 3 && (
                <div className="px-1.5 sm:px-3 pb-8 pt-4 flex justify-center items-end gap-1.5 sm:gap-4 border-b border-white/5 bg-white/[0.01]">
                  {/* 2nd Place */}
                  <div className="flex-1 max-w-[110px] sm:max-w-[140px] md:max-w-[180px] flex flex-col items-center text-center group">
                    <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-1 w-20 h-20 sm:w-26 sm:h-26 md:w-48 md:h-48">
                      <Image
                        src={getSquadPhoto(teamsData[1].name)}
                        alt={`${teamsData[1].name} jersey`}
                        fill
                        className="object-contain drop-shadow-[0_8px_16px_rgba(255,255,255,0.05)]"
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#94A3B8] border border-white/20 text-black text-[10px] font-black flex items-center justify-center shadow-lg">
                        2
                      </span>
                    </div>
                    <div className="w-full bg-gradient-to-b from-slate-400/10 via-slate-500/[0.02] to-transparent border-t border-x border-slate-400/20 rounded-t-xl p-1.5 sm:p-2.5 flex flex-col items-center min-h-[90px] sm:min-h-[105px] md:min-h-[130px] justify-center">
                      <span className="text-[9px] sm:text-xs md:text-sm font-bold text-slate-300 truncate max-w-full flex items-center justify-center gap-1">
                        <span
                          className={`fi fi-${teamsData[1].flag} rounded-sm shrink-0`}
                          style={{ width: "12px", height: "9px" }}
                        />
                        <span className="truncate">{teamsData[1].name}</span>
                      </span>
                      <span className="text-xs sm:text-sm md:text-lg font-black text-white mt-1">
                        {teamsData[1].points}{" "}
                        <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold uppercase">
                          pts
                        </span>
                      </span>
                      <span className="text-[8px] sm:text-[9px] md:text-xs text-slate-500 font-semibold mt-0.5 uppercase tracking-wide truncate max-w-full">
                        {teamsData[1].count} members
                      </span>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex-1 max-w-[130px] sm:max-w-[160px] md:max-w-[210px] flex flex-col items-center text-center group z-10">
                    <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-1 w-24 h-24 sm:w-32 sm:h-32 md:w-56 md:h-56">
                      <Image
                        src={getSquadPhoto(teamsData[0].name)}
                        alt={`${teamsData[0].name} jersey`}
                        fill
                        className="object-contain drop-shadow-[0_10px_20px_rgba(251,191,36,0.15)]"
                      />
                      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FBBF24] border border-white/20 text-black text-[11px] font-black flex items-center justify-center shadow-lg">
                        1
                      </span>
                    </div>
                    <div className="w-full bg-gradient-to-b from-[#FBBF24]/15 via-yellow-600/[0.02] to-transparent border-t border-x border-[#FBBF24]/30 rounded-t-xl p-2 sm:p-3 flex flex-col items-center min-h-[110px] sm:min-h-[130px] md:min-h-[160px] justify-center shadow-[0_-8px_24px_rgba(251,191,36,0.06)]">
                      <span className="text-[10px] sm:text-sm md:text-base font-extrabold text-[#FBBF24] truncate max-w-full flex items-center justify-center gap-1.5">
                        <span
                          className={`fi fi-${teamsData[0].flag} rounded-sm shrink-0`}
                          style={{ width: "14px", height: "10.5px" }}
                        />
                        <span className="truncate">{teamsData[0].name}</span>
                      </span>
                      <span className="text-sm sm:text-base md:text-2xl font-black text-white mt-1">
                        {teamsData[0].points}{" "}
                        <span className="text-[9px] sm:text-[10px] text-[#FBBF24] font-semibold uppercase">
                          pts
                        </span>
                      </span>
                      <span className="text-[9px] sm:text-slate-400 md:text-xs font-semibold mt-0.5 uppercase tracking-wide truncate max-w-full">
                        {teamsData[0].count} members
                      </span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex-1 max-w-[100px] sm:max-w-[130px] md:max-w-[160px] flex flex-col items-center text-center group">
                    <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-1 w-18 h-18 sm:w-22 sm:h-22 md:w-40 md:h-40">
                      <Image
                        src={getSquadPhoto(teamsData[2].name)}
                        alt={`${teamsData[2].name} jersey`}
                        fill
                        className="object-contain drop-shadow-[0_6px_12px_rgba(217,119,6,0.05)]"
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D97706] border border-white/20 text-black text-[10px] font-black flex items-center justify-center shadow-lg">
                        3
                      </span>
                    </div>
                    <div className="w-full bg-gradient-to-b from-amber-700/10 via-amber-800/[0.02] to-transparent border-t border-x border-amber-700/20 rounded-t-xl p-1.5 sm:p-2.5 flex flex-col items-center min-h-[75px] sm:min-h-[90px] md:min-h-[110px] justify-center">
                      <span className="text-[9px] sm:text-xs md:text-sm font-bold text-amber-500 truncate max-w-full flex items-center justify-center gap-1">
                        <span
                          className={`fi fi-${teamsData[2].flag} rounded-sm shrink-0`}
                          style={{ width: "12px", height: "9px" }}
                        />
                        <span className="truncate">{teamsData[2].name}</span>
                      </span>
                      <span className="text-xs sm:text-sm md:text-lg font-black text-white mt-1">
                        {teamsData[2].points}{" "}
                        <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold uppercase">
                          pts
                        </span>
                      </span>
                      <span className="text-[8px] sm:text-[9px] md:text-xs text-slate-500 font-semibold mt-0.5 uppercase tracking-wide truncate max-w-full">
                        {teamsData[2].count} members
                      </span>
                    </div>
                  </div>
                </div>
              )}

            {activeTab === "squad" ? (
              /* SQUAD LIST */
              dbStatus === "connecting" ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Loading Squads...
                  </span>
                </div>
              ) : filteredTeams.length > 0 ? (
                (searchQuery ? filteredTeams : filteredTeams.slice(3)).map(
                  (team) => (
                    <div
                      key={team.name}
                      className="flex items-center justify-between py-3 px-2 sm:px-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors group last:border-b-0"
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
                            <span
                              className="text-[#00E676] text-[10px] drop-shadow-[0_0_2px_#00E676]"
                              aria-label="Rank increased"
                            >
                              ▲
                            </span>
                          )}
                          {team.rankTrend === "down" && (
                            <span
                              className="text-[#4F46E5] text-[10px] drop-shadow-[0_0_2px_#4F46E5]"
                              aria-label="Rank decreased"
                            >
                              ▼
                            </span>
                          )}
                          {team.rankTrend === "stable" && (
                            <span
                              className="text-slate-700 text-[8px]"
                              aria-label="Rank stable"
                            >
                              •
                            </span>
                          )}
                        </div>

                        {/* Team Flag & Name */}
                        <span className="text-xs sm:text-base font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-2">
                          <span
                            className={`fi fi-${team.flag} rounded-sm shadow-sm border border-white/10 shrink-0`}
                            style={{ width: "18px", height: "13.5px" }}
                            role="img"
                            aria-label={`${team.name} flag`}
                          />
                          <span>{team.name}</span>
                        </span>
                      </div>

                      {/* Points & Members */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs sm:text-base font-bold text-[#06B6D4]">
                            {team.points}
                          </span>
                          <span className="text-[12px] text-slate-400 uppercase tracking-wider">
                            pts
                          </span>
                        </div>
                        <div className="text-white/10">|</div>
                        <div className="flex items-center gap-1">
                          <span className="text-[12px] font-medium text-slate-200">
                            {team.count}
                          </span>
                          <span className="text-[12px] text-slate-400 uppercase tracking-wider">
                            members
                          </span>
                        </div>
                      </div>
                    </div>
                  ),
                )
              ) : (
                <div className="py-12 mx-2 sm:mx-3 text-center text-slate-500 text-xs font-bold border border-white/5 rounded-lg bg-white/[0.005]">
                  No squad matches your search query.
                </div>
              )
            ) : /* INDIVIDUAL PLAYERS LIST */
            playersLoading && playersData.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Loading Leaderboard...
                </span>
              </div>
            ) : playersData.length > 0 ? (
              <>
                {playersData.map((player, idx) => {
                  const rank = player.rank || (idx + 1);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between py-3 px-2 sm:px-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors group last:border-b-0 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Rank */}
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold border shrink-0 ${getRankStyle(rank)}`}
                        >
                          {rank}
                        </span>

                        {/* Avatar */}
                        <div className="relative w-7 h-7 md:w-10 md:h-10 rounded-full bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                          {player.avatar_url ? (
                            <Image
                              src={player.avatar_url}
                              alt={player.name || "Player Avatar"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400">
                              {getInitials(player.name)}
                            </span>
                          )}
                        </div>

                        {/* Name & Player ID */}
                        <div className="flex flex-col min-w-0 text-left">
                          <Link
                            href={`/profile/${player.user_id}`}
                            className="text-xs sm:text-sm md:text-base font-semibold text-slate-200 group-hover:text-white hover:underline transition-colors truncate"
                          >
                            {player.name}
                          </Link>
                          <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 truncate">
                            @{player.user_id}
                          </span>
                        </div>
                      </div>

                      {/* Team & Domain & Points */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Domain Badge */}
                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-slate-400">
                          {player.domain}
                        </span>

                        {/* Team flag */}
                        {FLAGS[player.team] && (
                          <span
                            className={`fi fi-${FLAGS[player.team]} rounded-sm shadow-sm border border-white/10`}
                            style={{ width: "16px", height: "12px" }}
                            title={player.team}
                          />
                        )}

                        {/* Points */}
                        <div className="flex items-center gap-0.5 min-w-[50px] justify-end">
                          <span className="text-xs sm:text-base md:text-lg font-bold text-[#06B6D4]">
                            {player.mu_points || 0}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">
                            pts
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* VIEW MORE PAGINATION */}
                {hasMorePlayers && (
                  <div className="pt-4 pb-2 text-center no-print border-t border-white/5">
                    <button
                      onClick={() => fetchPlayers(playersData.length, false)}
                      disabled={playersLoading}
                      className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                    >
                      {playersLoading ? (
                        <>
                          <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Loading More...
                        </>
                      ) : (
                        "View More Players"
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 mx-2 sm:mx-3 text-center text-slate-500 text-xs font-bold border border-white/5 rounded-lg bg-white/[0.005]">
                No players match your search query.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
